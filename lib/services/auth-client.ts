type AuthActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | { status: "invalid"; message: string };

async function postAuthAction(path: string, body: Record<string, string>): Promise<AuthActionResult> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      return { status: "error", message: payload.message ?? payload.error ?? "Não foi possível concluir esta ação." };
    }

    return { status: "success", message: payload.message ?? "Ação concluída com sucesso." };
  } catch {
    return { status: "error", message: "Erro de conexão. Tente novamente." };
  }
}

export function registerClient(name: string, email: string, password: string) {
  if (!name.trim() || !email.trim() || !password) {
    return Promise.resolve<AuthActionResult>({ status: "invalid", message: "Preencha todos os campos." });
  }

  return postAuthAction("/api/auth/register", { nome: name.trim(), email: email.trim().toLowerCase(), senha: password });
}

export function requestPasswordResetClient(email: string) {
  if (!email.trim()) {
    return Promise.resolve<AuthActionResult>({ status: "invalid", message: "Informe seu e-mail." });
  }

  return postAuthAction("/api/auth/forgot-password", { email: email.trim().toLowerCase() });
}

export function resetPasswordClient(token: string, password: string) {
  if (!token.trim() || !password) {
    return Promise.resolve<AuthActionResult>({ status: "invalid", message: "Informe o código e a nova senha." });
  }

  return postAuthAction("/api/auth/reset-password", { token: token.trim(), senha: password });
}
