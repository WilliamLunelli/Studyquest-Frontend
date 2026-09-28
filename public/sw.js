const CACHE_NAME = "studyquest-shell-v1";
const RUNTIME_CACHE = "studyquest-runtime-v1";
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

  if (isQueueableMutation(request)) {
    event.respondWith(handleMutation(request));
  }
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
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      return (await caches.match("/")) ?? offlineResponse();
    }

    return offlineResponse();
  }
}

async function handleMutation(request) {
  try {
    const response = await fetch(request.clone());
    if (response.status === 409) {
      await saveConflict(request, response);
    }
    return response;
  } catch {
    await enqueueRequest(request);
    await registerSync();
    await notifyClients({ type: "QUEUE_UPDATED" });
    return new Response(JSON.stringify({ queued: true, message: "Alteracao salva para sincronizar quando houver conexao." }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function isQueueableMutation(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api/") && request.method !== "GET" && request.method !== "HEAD" && url.pathname !== "/api/auth/login";
}

function offlineResponse() {
  return new Response(JSON.stringify({ offline: true, message: "Sem conexao. Tente novamente quando a rede voltar." }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
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

async function enqueueRequest(request) {
  const headers = Object.fromEntries(request.headers.entries());
  const body = request.method === "DELETE" ? null : await request.clone().text();
  await transaction(OUTBOX_STORE, "readwrite", (store) =>
    store.add({ url: request.url, method: request.method, headers, body, createdAt: Date.now(), attempts: 0 }),
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

async function registerSync() {
  if (self.registration.sync) {
    await self.registration.sync.register("studyquest-outbox");
  }
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((client) => client.postMessage(message));
}