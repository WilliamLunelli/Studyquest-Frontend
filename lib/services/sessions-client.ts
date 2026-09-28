import { API_CONFIG, buildApiUrl, getAuthHeader } from "@/lib/api-config";

export type SessionType = "TEORIA" | "QUESTOES" | "REVISAO";
export type SessionPreset = "P25_5" | "P50_10" | "LIVRE";
export type SessionStatus = "RUNNING" | "PAUSED" | "FINISHED" | "ABANDONED";
export type SelfAssessment = "travei" | "ok" | "tranquilo";

export type CreateSessionInput = {
  blocoId?: string;
  subjectId: string;
  topicId: string;
  tipo: SessionType;
  preset: SessionPreset;
  duracaoAlvoMin?: 25 | 50;
  reviewId?: string;
};

export type ActiveSession = {
  id: string;
  userId?: string;
  subjectId: string;
  topicId: string;
  type: SessionType;
  preset: SessionPreset;
  status: SessionStatus;
  startedAt: string;
  resumedAt?: string | null;
  pausedAt?: string | null;
  minutosAcumulados: number;
  duracaoAlvoMin?: number | null;
};

export type FinishedSession = {
  sessao: {
    id: string;
    minutosTotais: number;
    tipo: SessionType;
    finishedAt: string;
  };
  xp: {
    ganho: number;
    multiplicador: number;
    total: number;
    nivelAnterior: number;
    nivelAtual: number;
    subiuDeNivel: boolean;
  };
  streak: {
    atual: number;
    recorde: number;
    escudoUsado: boolean;
  };
  proximaRevisao: unknown;
  proximoBloco: unknown;
};

export type SessionClientError = {
  status: "unauthorized" | "conflict" | "error" | "offline";
  message: string;
};

export type SessionResult<T> = { status: "ok"; data: T } | SessionClientError;

type SessionPayload = ActiveSession | { sessao: ActiveSession };

function unwrapSession(payload: SessionPayload): ActiveSession {
  return "sessao" in payload ? payload.sessao : payload;
}

async function request<T>(url: string, init: RequestInit = {}): Promise<SessionResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...API_CONFIG.headers,
        ...getAuthHeader(),
        ...init.headers,
      },
    });

    if (response.status === 401) return { status: "unauthorized", message: "Sua sessão expirou." };
    if (response.status === 409) return { status: "conflict", message: await readError(response) };

    const payload = (await response.json().catch(() => null)) as (T & { queued?: boolean; message?: string }) | null;
    if (!response.ok) return { status: "error", message: payload?.message ?? "Não foi possível atualizar a sessão." };
    if (payload?.queued) return { status: "offline", message: payload.message ?? "A alteração será sincronizada quando houver conexão." };

    return { status: "ok", data: payload as T };
  } catch {
    return { status: "offline", message: "Sem conexão. A alteração será sincronizada quando a rede voltar." };
  }
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
  return payload?.message ?? payload?.error ?? "A sessão mudou em outro dispositivo.";
}

export function createSession(input: CreateSessionInput) {
  return request<SessionPayload>(buildApiUrl(API_CONFIG.endpoints.sessions), {
    method: "POST",
    body: JSON.stringify(input),
  }).then((result) => result.status === "ok" ? { ...result, data: unwrapSession(result.data) } : result);
}

export async function getActiveSession(): Promise<SessionResult<ActiveSession | null>> {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.endpoints.activeSession), {
      headers: { ...API_CONFIG.headers, ...getAuthHeader() },
    });

    if (response.status === 204) return { status: "ok", data: null };
    if (response.status === 401) return { status: "unauthorized", message: "Sua sessão expirou." };
    if (!response.ok) return { status: "error", message: await readError(response) };

    return { status: "ok", data: unwrapSession((await response.json()) as SessionPayload) };
  } catch {
    return { status: "offline", message: "Não foi possível verificar a sessão ativa." };
  }
}

export function pauseSession(sessionId: string) {
  return request<ActiveSession>(buildApiUrl(`${API_CONFIG.endpoints.sessions}/${sessionId}/pause`), { method: "PATCH" });
}

export function resumeSession(sessionId: string) {
  return request<ActiveSession>(buildApiUrl(`${API_CONFIG.endpoints.sessions}/${sessionId}/resume`), { method: "PATCH" });
}

export function finishSession(sessionId: string, autoavaliacao: SelfAssessment, nota?: string) {
  return request<FinishedSession>(buildApiUrl(`${API_CONFIG.endpoints.sessions}/${sessionId}/finish`), {
    method: "POST",
    body: JSON.stringify({ autoavaliacao, ...(nota?.trim() ? { nota: nota.trim() } : {}) }),
  });
}