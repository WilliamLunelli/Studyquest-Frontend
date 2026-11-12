import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

function fixture(fetch) {
  let now = Date.parse("2026-11-12T15:00:00Z");
  class Clock extends Date { static now() { return now; } }
  const helpers = loadTypeScript("../lib/frontend/session.ts", {}, { Date: Clock });
  const storage = new Map();
  const client = loadTypeScript("../lib/services/sessions-client.ts", {
    "@/lib/api-config": {
      API_CONFIG: { headers: {}, endpoints: { sessions: "/sessions", activeSession: "/sessions/active" } },
      buildApiUrl: (path) => `https://api.example.invalid${path}`, getAuthHeader: () => ({}),
    },
    "@/lib/frontend/session": helpers,
    "@/lib/user-storage": { readUserStorage: (key) => storage.get(key) ?? null, writeUserStorage: (key, value) => storage.set(key, value) },
  }, { fetch, Date: Clock });
  const session = (status = "RUNNING") => helpers.normalizeSession({ id: "session", status, minutosAcumulados: 6, tipo: "TEORIA", preset: "LIVRE" }, { subjectId: "biology", topicId: "cells" });
  return { client, helpers, storage, session, advance: (ms) => { now += ms; } };
}

test("opening assessment pauses at the server and freezes the displayed seconds", async () => {
  const requests = [];
  const f = fixture(async (url, init) => {
    requests.push([url, init.method]);
    return Response.json({ id: "session", status: "PAUSED", minutosAcumulados: 6 });
  });
  const running = f.session();
  f.advance(38_000);
  const result = await f.client.prepareSessionAssessment(running);
  assert.equal(result.status, "ok");
  assert.deepEqual(requests, [["https://api.example.invalid/sessions/session/pause", "PATCH"]]);
  assert.equal(result.data.status, "PAUSED");
  assert.equal(f.helpers.elapsedSessionSeconds(result.data), 398);
  f.advance(120_000);
  assert.equal(f.helpers.elapsedSessionSeconds(result.data), 398);
});

test("opening assessment on a paused session does not pause it a second time", async () => {
  const f = fixture(() => assert.fail("Already paused session caused a request"));
  const result = await f.client.prepareSessionAssessment(f.session("PAUSED"));
  assert.equal(result.status, "ok");
  assert.equal(result.data.status, "PAUSED");
});

test("an unconfirmed pause cannot be treated as a ready assessment", async () => {
  const f = fixture(async () => { throw new Error("offline"); });
  const result = await f.client.prepareSessionAssessment(f.session());
  assert.equal(result.status, "offline");
  assert.equal(f.storage.has("active_session_clock"), false);
});

test("a completed session rejects resume, pause, and duplicate finish even with a stale paused object", async () => {
  let requests = 0;
  const f = fixture(async () => { requests++; return Response.json({ sessao: { id: "session", minutosTotais: 6 } }); });
  const paused = f.session("PAUSED");
  assert.equal((await f.client.finishSession(paused.id, "ok")).status, "ok");
  assert.equal((await f.client.resumeSession(paused.id, paused)).status, "conflict");
  assert.equal((await f.client.pauseSession(paused.id, paused)).status, "conflict");
  assert.equal((await f.client.prepareSessionAssessment(paused)).status, "conflict");
  assert.equal((await f.client.finishSession(paused.id, "ok")).status, "conflict");
  assert.equal(requests, 1);
  assert.equal(f.storage.get("active_session_clock"), null);
});

test("finished and abandoned session snapshots cannot be resumed or assessed", async () => {
  const f = fixture(() => assert.fail("Terminal session reached the server"));
  for (const status of ["FINISHED", "ABANDONED"]) {
    const terminal = f.session(status);
    assert.equal((await f.client.resumeSession(terminal.id, terminal)).status, "conflict");
    assert.equal((await f.client.prepareSessionAssessment(terminal)).status, "conflict");
  }
});

test("a late active-session response cannot restore a completed clock", async () => {
  let release;
  const response = new Promise((resolve) => { release = resolve; });
  const f = fixture(async (url) => url.endsWith("/active") ? response : Response.json({ sessao: { id: "session", minutosTotais: 6 } }));
  const read = f.client.getActiveSession();
  await f.client.finishSession("session", "ok");
  release(Response.json({ id: "session", status: "RUNNING", minutosAcumulados: 6 }));
  assert.equal((await read).data, null);
  assert.equal(f.storage.get("active_session_clock"), null);
});

test("a late resume response cannot overwrite the clock cleared by completion", async () => {
  let release;
  const response = new Promise((resolve) => { release = resolve; });
  const f = fixture(async (url) => url.endsWith("/resume") ? response : Response.json({ sessao: { id: "session", minutosTotais: 6 } }));
  const resume = f.client.resumeSession("session", f.session("PAUSED"));
  await f.client.finishSession("session", "ok");
  release(Response.json({ id: "session", status: "RUNNING", minutosAcumulados: 6 }));
  assert.equal((await resume).status, "conflict");
  assert.equal(f.storage.get("active_session_clock"), null);
});

test("an externally ended session is cleared and its old paused snapshot cannot resume", async () => {
  let requests = 0;
  const f = fixture(async () => { requests++; return new Response(null, { status: 204 }); });
  const paused = f.session("PAUSED");
  f.storage.set("active_session_clock", paused);
  assert.equal((await f.client.getActiveSession()).data, null);
  assert.equal((await f.client.resumeSession(paused.id, paused)).status, "conflict");
  assert.equal(requests, 1);
});
