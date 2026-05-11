/**
 * Login Client
 * Handles login request and JWT storage
 * Contract: POST /api/users/login → { message, token, user }
 */

import { saveAuth, AuthResponse } from "@/lib/jwt-auth";

export type LoginResult =
  | { status: "success"; data: AuthResponse }
  | { status: "error"; message: string }
  | { status: "invalid"; message: string };

function isAuthResponse(value: unknown): value is AuthResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { message?: unknown; token?: unknown; user?: unknown };

  return (
    typeof candidate.message === "string" &&
    typeof candidate.token === "string" &&
    typeof candidate.user === "object" &&
    candidate.user !== null
  );
}

export async function loginClient(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    // Validate input
    if (!email || !password) {
      return { status: "invalid", message: "Email e senha são obrigatórios." };
    }

    // Call BFF login endpoint
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      // Handle error response from backend
      const message = (data.error || data.message || "Erro ao fazer login.") as string;
      return { status: "error", message };
    }

    // Save JWT and user to localStorage
    if (!isAuthResponse(data)) {
      return { status: "error", message: "Resposta inválida do servidor de autenticação." };
    }

    const loginData = data;
    saveAuth(loginData);

    return { status: "success", data: loginData };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao conectar.";
    return { status: "error", message };
  }
}
