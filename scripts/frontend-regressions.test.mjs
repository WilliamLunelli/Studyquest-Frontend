import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { loadTypeScript } from "./load-typescript.mjs";

const { normalizeSession, elapsedSessionSeconds, presetForBlockDuration, validateQuestionCounts } = loadTypeScript("../lib/frontend/session.ts");

const snapshotAt = Date.parse("2026-11-08T15:00:00Z");

test("reloading a running session uses the server total once, even with a much older start", () => {
  const session = normalizeSession({ id: "session", tipo: "TEORIA", preset: "P50_10", status: "RUNNING", startedAt: "2026-11-08T14:00:00Z", minutosAcumulados: 12 }, undefined, snapshotAt);
  assert.equal(elapsedSessionSeconds(session, snapshotAt), 720);
  assert.equal(elapsedSessionSeconds(session, snapshotAt + 19_000), 739);
});

test("pause preserves partial seconds while keeping the server total separate", () => {
  const running = normalizeSession({ id: "session", status: "RUNNING", minutosAcumulados: 7 }, { subjectId: "biology", topicId: "cells", preset: "P25_5" }, snapshotAt);
  const paused = normalizeSession({ id: "session", status: "PAUSED", minutosAcumulados: 8 }, running, snapshotAt + 65_000);
  assert.equal(elapsedSessionSeconds(paused, snapshotAt + 600_000), 485);
  assert.equal(paused.minutosAcumulados, 8);
  const resumed = normalizeSession({ id: "session", status: "RUNNING", minutosAcumulados: 8 }, paused, snapshotAt + 600_000);
  assert.equal(elapsedSessionSeconds(resumed, snapshotAt + 615_000), 500);
  assert.equal(resumed.subjectId, "biology");
  assert.equal(resumed.topicId, "cells");
});

test("pausing before the first minute never resets the displayed clock", () => {
  const running = normalizeSession({ id: "short", status: "RUNNING", minutosAcumulados: 0 }, undefined, snapshotAt);
  const paused = normalizeSession({ id: "short", status: "PAUSED", minutosAcumulados: 0 }, running, snapshotAt + 35_000);
  assert.equal(elapsedSessionSeconds(paused, snapshotAt + 600_000), 35);
  const restored = normalizeSession({ id: "short", status: "PAUSED", minutosAcumulados: 0 }, JSON.parse(JSON.stringify(paused)), snapshotAt + 600_000);
  assert.equal(elapsedSessionSeconds(restored, snapshotAt + 700_000), 35);
});

test("repeated short pauses preserve visual time without inventing credited minutes", () => {
  let session = normalizeSession({ id: "short", status: "RUNNING", minutosAcumulados: 0 }, undefined, snapshotAt);
  session = normalizeSession({ id: "short", status: "PAUSED", minutosAcumulados: 0 }, session, snapshotAt + 35_000);
  session = normalizeSession({ id: "short", status: "RUNNING", minutosAcumulados: 0 }, session, snapshotAt + 60_000);
  session = normalizeSession({ id: "short", status: "PAUSED", minutosAcumulados: 0 }, session, snapshotAt + 95_000);
  assert.equal(elapsedSessionSeconds(session, snapshotAt + 500_000), 70);
  assert.equal(session.minutosAcumulados, 0);
});

test("running recovery retains seconds without counting the accumulated minutes twice", () => {
  const running = normalizeSession({ id: "running", status: "RUNNING", minutosAcumulados: 0 }, undefined, snapshotAt);
  const restored = normalizeSession({ id: "running", status: "RUNNING", minutosAcumulados: 1 }, running, snapshotAt + 75_000);
  assert.equal(elapsedSessionSeconds(restored, snapshotAt + 80_000), 80);
});

test("a different session never inherits the previous session's elapsed time", () => {
  const previous = normalizeSession({ id: "old", status: "RUNNING", minutosAcumulados: 30 }, undefined, snapshotAt);
  const current = normalizeSession({ id: "new", status: "RUNNING", minutosAcumulados: 0 }, previous, snapshotAt + 60_000);
  assert.equal(elapsedSessionSeconds(current, snapshotAt + 60_000), 0);
  assert.equal(current.subjectId, "");
});

test("a cycle block does not silently use a different preset duration", () => {
  assert.equal(presetForBlockDuration(25), "P25_5");
  assert.equal(presetForBlockDuration(50), "P50_10");
  assert.equal(presetForBlockDuration(40), "LIVRE");
  assert.equal(presetForBlockDuration(60), "LIVRE");
});

test("a recovered four-minute review cannot reach five minutes from its original timestamp", () => {
  const session = normalizeSession({ id: "review", tipo: "REVISAO", status: "RUNNING", startedAt: "2026-11-08T14:50:00Z", minutosAcumulados: 4 }, undefined, snapshotAt);
  assert.equal(elapsedSessionSeconds(session, snapshotAt + 59_000), 299);
  assert.equal(elapsedSessionSeconds(session, snapshotAt + 60_000), 300);
});

test("clock correction never removes the already confirmed study time", () => {
  const session = normalizeSession({ status: "RUNNING", minutosAcumulados: 3 }, undefined, snapshotAt);
  assert.equal(elapsedSessionSeconds(session, snapshotAt - 60_000), 180);
});

test("free sessions retain no artificial fifty-minute target", () => {
  const session = normalizeSession({ preset: "LIVRE", duracaoAlvoMin: null }, undefined, snapshotAt);
  assert.equal(session.duracaoAlvoMin, null);
});

test("question entries accept optional omission and valid boundary counts", () => {
  for (const [done, correct] of [["", ""], ["1", "0"], ["500", "500"], ["10", "8"]]) assert.equal(validateQuestionCounts(done, correct), null);
});

test("invalid question counts are rejected before the study session is finished", () => {
  for (const [done, correct] of [["10", "2.5"], ["2.5", "1"], ["0", "0"], ["501", "0"], ["10", "11"], ["10", "-1"], ["", "1"], ["10", ""], ["10", "NaN"]]) assert.ok(validateQuestionCounts(done, correct));
});

test("an uncached offline session navigation never substitutes the landing page", async () => {
  const context = vm.createContext({
    self: { addEventListener() {} }, Response,
    caches: { open: async () => ({ match: async () => undefined }), match: async () => undefined },
    fetch: async () => { throw new Error("offline"); },
    request: { mode: "navigate", url: "http://localhost:3000/session" },
  });
  vm.runInContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), context);
  const response = await vm.runInContext("handleGet(request)", context);
  assert.equal(response.status, 503);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(await response.text(), /não encerra nem reinicia sua sessão/);
});
