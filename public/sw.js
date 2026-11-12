const CACHE_NAME = "studyquest-shell-v5";
const RUNTIME_CACHE = "studyquest-runtime-v5";

const SHELL_URLS = ["/", "/login", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(SHELL_URLS);
      } catch {
        // Storage or network failures must not prevent the worker update.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("studyquest-") && ![CACHE_NAME, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key)));
      } catch {
        // The application can still use the network without Cache Storage.
      }
      await self.clients.claim();
    })(),
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

  // Writes always require a server response. Legacy entries are reviewed in the UI;
  // never replay them with a stored token or after a change of account.
});

async function handleGet(request) {
  let response;
  try {
    response = await fetch(request);
  } catch {
    for (const name of [RUNTIME_CACHE, CACHE_NAME]) {
      try {
        const cache = await caches.open(name);
        const cached = await cache.match(request);
        if (cached) return cached;
      } catch {
        // An unavailable cache must still produce a useful offline response.
      }
    }
    return request.mode === "navigate" ? offlineNavigationResponse() : offlineResponse();
  }
  if (response.ok && (request.mode === "navigate" || new URL(request.url).pathname.startsWith("/_next/"))) {
    try {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    } catch {
      // Preserve the network response even if the cache is full or blocked.
    }
  }
  return response;
}

function offlineResponse() {
  return new Response(JSON.stringify({ offline: true, message: "Sem conexão. Tente novamente quando a rede voltar." }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

function offlineNavigationResponse() {
  return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>StudyQuest | Sem conexão</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:12vh auto;padding:1.5rem;line-height:1.6"><h1>Não foi possível abrir esta tela</h1><p>Reconecte para consultar sua sessão antes de iniciar outra. Esta mensagem não encerra nem reinicia sua sessão.</p><a href="">Tentar novamente</a><p><a href="/">Ir para o início</a></p></body></html>`, {
    status: 503, headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
