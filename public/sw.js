const CACHE_NAME = "studyquest-shell-v3";
const RUNTIME_CACHE = "studyquest-runtime-v3";
const DB_NAME = "studyquest-offline";
const DB_VERSION = 1;
const OUTBOX_STORE = "outbox";
const CONFLICT_STORE = "conflicts";

const SHELL_URLS = ["/", "/login", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => ![CACHE_NAME, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.method === "GET") {
    event.respondWith(handleGet(request));
    return;
  }

  // Mutations must reach the server. Do not acknowledge an offline write as saved.
  // Existing outbox entries from the previous version can still be flushed below.
});

self.addEventListener("sync", (event) => {
  if (event.tag === "studyquest-outbox") {
    event.waitUntil(flushOutbox());
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SYNC_OUTBOX") {
    event.waitUntil(flushOutbox());
  }
});

async function handleGet(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok && (request.mode === "navigate" || request.url.includes("/_next/"))) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = (await cache.match(request)) ?? (await caches.match(request));
    if (cached) return cached;

    if (request.mode === "navigate") {
      return offlineNavigationResponse();
    }

    return offlineResponse();
  }
}

function offlineResponse() {
  return new Response(JSON.stringify({ offline: true, message: "Sem conexao. Tente novamente quando a rede voltar." }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

function offlineNavigationResponse() {
  return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>StudyQuest | Sem conexão</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:12vh auto;padding:1.5rem;line-height:1.6"><h1>Não foi possível abrir esta tela</h1><p>Reconecte para consultar sua sessão antes de iniciar outra. Esta mensagem não encerra nem reinicia sua sessão.</p><a href="">Tentar novamente</a><p><a href="/">Ir para o início</a></p></body></html>`, {
    status: 503, headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) db.createObjectStore(OUTBOX_STORE, { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains(CONFLICT_STORE)) db.createObjectStore(CONFLICT_STORE, { keyPath: "id", autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction(storeName, mode, callback) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const request = callback(transaction.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

async function saveConflict(request, response) {
  const body = await response.clone().text();
  await transaction(CONFLICT_STORE, "readwrite", (store) =>
    store.add({ url: request.url, method: request.method, body, createdAt: Date.now(), status: response.status }),
  );
  await notifyClients({ type: "SYNC_CONFLICT" });
}

async function flushOutbox() {
  const entries = await transaction(OUTBOX_STORE, "readonly", (store) => store.getAll());

  for (const entry of entries) {
    try {
      const response = await fetch(entry.url, { method: entry.method, headers: entry.headers, body: entry.body });
      if (response.status === 409) {
        await saveConflict(new Request(entry.url, { method: entry.method, headers: entry.headers, body: entry.body }), response);
      }
      if (response.ok || response.status === 409) {
        await transaction(OUTBOX_STORE, "readwrite", (store) => store.delete(entry.id));
      }
    } catch {
      await transaction(OUTBOX_STORE, "readwrite", (store) => store.put({ ...entry, attempts: entry.attempts + 1 }));
    }
  }

  await notifyClients({ type: "SYNC_COMPLETE" });
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((client) => client.postMessage(message));
}
