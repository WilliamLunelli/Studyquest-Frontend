import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

function loginRoute(fetch) {
  return loadTypeScript("../app/api/auth/login/route.ts", {
    "next/server": { NextResponse: { json: Response.json } },
    "@/lib/api-config": {
      API_CONFIG: { endpoints: { login: "/auth/login" }, headers: {} },
      buildApiUrl: (endpoint) => `https://api.example.invalid${endpoint}`,
    },
  }, { fetch });
}

function loginRequest(password, email = " Test@Example.Invalid ") {
  return new Request("https://studyquest.example.invalid/api/auth/login", {
    method: "POST", body: JSON.stringify({ email, password }),
  });
}

test("registration and login send identical passwords, including surrounding spaces", async () => {
  for (const password of [" abcdefgh ", "        ", "senha com espaços ✓  "]) {
    let registeredPassword;
    const register = loadTypeScript("../lib/services/auth-client.ts", { "@/lib/jwt-auth": { saveAuth() {} } }, {
      fetch: async (_, init) => {
        registeredPassword = JSON.parse(init.body).senha;
        return Response.json({ id: "audit", nome: "Audit", email: "test@example.invalid", token: "synthetic" });
      },
    });
    assert.equal((await register.registerClient("Audit", "test@example.invalid", password)).status, "success");
    const route = loginRoute(async (_, init) => {
      const body = JSON.parse(init.body);
      assert.equal(body.email, "test@example.invalid");
      assert.equal(body.senha, registeredPassword);
      return Response.json({ token: "synthetic", user: {} });
    });
    assert.equal((await route.POST(loginRequest(password))).status, 200);
  }
});

test("invalid login credentials are rejected before a backend request", async () => {
  const route = loginRoute(() => { assert.fail("Invalid credentials reached the backend"); });
  for (const password of ["", 123, null]) assert.equal((await route.POST(loginRequest(password))).status, 400);
});

test("login preserves the backend authentication failure", async () => {
  const route = loginRoute(async () => Response.json({ message: "E-mail ou senha inválidos." }, { status: 401 }));
  const response = await route.POST(loginRequest("valid-length"));
  assert.equal(response.status, 401);
  assert.equal((await response.json()).message, "E-mail ou senha inválidos.");
});

test("legacy offline notices expose no token, request body, or query parameters", () => {
  const { legacyEntryNotice } = loadTypeScript("../lib/offline-store.ts");
  const notice = legacyEntryNotice({
    id: 7, url: "https://example.invalid/api/onboarding/goal?token=secret", method: "PUT",
    headers: { Authorization: "Bearer secret" }, body: '{"password":"secret"}',
    createdAt: 123, status: 401,
  }, "outbox");
  assert.deepEqual(JSON.parse(JSON.stringify(notice)), { id: 7, store: "outbox", path: "/api/onboarding/goal", createdAt: 123, status: 401 });
  assert.doesNotMatch(JSON.stringify(notice), /secret|password|Authorization/);
});
