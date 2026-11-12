import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function worker({ fetch, caches, skipWaiting = async () => {}, claim = async () => {} }) {
  const handlers = new Map();
  const context = vm.createContext({
    self: { addEventListener: (name, handler) => handlers.set(name, handler), location: { origin: "https://studyquest.example.invalid" }, skipWaiting, clients: { claim } },
    Response, URL, fetch, caches,
  });
  vm.runInContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), context);
  return { context, handlers };
}

const navigation = { mode: "navigate", url: "https://studyquest.example.invalid/session" };
const blockedCache = { open: async () => { throw new Error("Storage blocked"); } };

test("a blocked cache never hides an online page or static asset", async () => {
  const { context } = worker({ fetch: async () => new Response("network", { status: 200 }), caches: blockedCache });
  for (const request of [navigation, { mode: "cors", url: "https://studyquest.example.invalid/_next/static/app.js" }]) {
    const response = await context.handleGet(request);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "network");
  }
});

test("a failed cache write returns the new response instead of a stale cached page", async () => {
  const { context } = worker({
    fetch: async () => new Response("fresh"),
    caches: { open: async () => ({ put: async () => { throw new Error("QuotaExceededError"); }, match: async () => new Response("stale") }) },
  });
  assert.equal(await (await context.handleGet(navigation)).text(), "fresh");
});

test("a cached page is still available without a network connection", async () => {
  const { context } = worker({ fetch: async () => { throw new Error("offline"); }, caches: { open: async () => ({ match: async () => new Response("cached session") }) } });
  assert.equal(await (await context.handleGet(navigation)).text(), "cached session");
});

test("offline navigation and API calls give useful responses even with blocked storage", async () => {
  const { context } = worker({ fetch: async () => { throw new Error("offline"); }, caches: blockedCache });
  const page = await context.handleGet(navigation);
  assert.equal(page.status, 503);
  assert.match(page.headers.get("content-type"), /text\/html/);
  assert.match(await page.text(), /não encerra nem reinicia sua sessão/);
  const api = await context.handleGet({ mode: "cors", url: "https://studyquest.example.invalid/api/home" });
  assert.equal(api.status, 503);
  assert.equal((await api.json()).offline, true);
});

test("backend errors are preserved instead of being replaced with cached data", async () => {
  const { context } = worker({ fetch: async () => Response.json({ message: "Unauthorized" }, { status: 401 }), caches: blockedCache });
  const response = await context.handleGet({ mode: "cors", url: "https://studyquest.example.invalid/api/home" });
  assert.equal(response.status, 401);
});

test("the worker can install and activate when cache storage is blocked", async () => {
  let skipped = false, claimed = false;
  const { handlers } = worker({ caches: { ...blockedCache, keys: async () => { throw new Error("blocked"); } }, skipWaiting: async () => { skipped = true; }, claim: async () => { claimed = true; } });
  const dispatch = async (name) => {
    let work;
    handlers.get(name)({ waitUntil: (promise) => { work = promise; } });
    await work;
  };
  await dispatch("install"); await dispatch("activate");
  assert.equal(skipped, true); assert.equal(claimed, true);
});

test("activation removes old StudyQuest caches while preserving other apps", async () => {
  const deleted = [];
    const { handlers } = worker({ caches: { keys: async () => ["studyquest-shell-v3", "studyquest-runtime-v4", "studyquest-runtime-v5", "another-app"], delete: async (key) => deleted.push(key) } });
  let work;
  handlers.get("activate")({ waitUntil: (promise) => { work = promise; } });
  await work;
  assert.deepEqual(deleted.sort(), ["studyquest-runtime-v4", "studyquest-shell-v3"]);
});

test("legacy sync events and writes never replay an old mutation", async () => {
  let requests = 0;
  const { handlers } = worker({ fetch: async () => { requests++; return new Response(); }, caches: blockedCache });
  for (const [name, event] of [["sync", { tag: "studyquest-outbox" }], ["message", { data: { type: "SYNC_OUTBOX" } }]]) {
    const work = [];
    handlers.get(name)?.({ ...event, waitUntil: (promise) => work.push(promise) });
    await Promise.all(work);
  }
  handlers.get("fetch")({ request: { url: "https://studyquest.example.invalid/api/question-logs", method: "POST" }, respondWith() { assert.fail("Write intercepted"); } });
  assert.equal(requests, 0);
});
