import { API_CONFIG, buildApiUrl, getAuthHeader } from "@/lib/api-config";
import { isActiveSession, normalizeSession, type ActiveSession, type SessionContext, type SessionPayload, type SessionPreset, type SessionType, type SelfAssessment } from "@/lib/frontend/session";
import { readUserStorage, writeUserStorage } from "@/lib/user-storage";

export { normalizeSession } from "@/lib/frontend/session";
export type { ActiveSession, SessionPreset, SessionType, SelfAssessment } from "@/lib/frontend/session";

export type CreateSessionInput = {
  blocoId?: string; subjectId: string; topicId: string; tipo: SessionType;
  preset: SessionPreset; duracaoAlvoMin?: 25 | 50; reviewId?: string;
};
export type FinishedSession = {
  sessao: { id: string; minutosTotais: number; tipo: SessionType; finishedAt: string };
  xp: { ganho: number; multiplicador: number; total: number; nivelAnterior: number; nivelAtual: number; subiuDeNivel: boolean };
  streak: { atual: number; metaCumprida: boolean; escudoUsado: boolean };
  proximaRevisao: { reviewId: string | null; agendadaPara: string | null; intervaloDias: number | null };
  proximoBloco: { blocoId: string | null; materia: string | null; assunto: string | null; duracaoMin: number | null };
};
export type SessionClientError = { status: "unauthorized" | "conflict" | "error" | "offline"; message: string };
export type SessionResult<T> = { status: "ok"; data: T } | SessionClientError;
let mutationRevision = 0;
const finishedSessions = new Set<string>();

const finishedSessionError: SessionClientError = { status: "conflict", message: "Esta sessão já foi encerrada. Confira seu progresso na Home." };

async function readError(response: Response) {
  const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
  return payload?.message ?? payload?.error ?? "Não foi possível atualizar a sessão.";
}

async function request<T>(url: string, init: RequestInit = {}): Promise<SessionResult<T>> {
  try {
    const response = await fetch(url, { ...init, headers: { ...API_CONFIG.headers, ...getAuthHeader(), ...init.headers }, cache: "no-store" });
    if (response.status === 401) return { status: "unauthorized", message: "Sua sessão expirou. Entre novamente." };
    if (response.status === 409) return { status: "conflict", message: await readError(response) };
    if (!response.ok) return { status: "error", message: await readError(response) };
    const payload = await response.json() as T & { queued?: boolean };
    if (payload?.queued) return { status: "offline", message: "A operação ainda não foi confirmada. Confira a sessão quando a conexão voltar." };
    return { status: "ok", data: payload };
  } catch {
    return { status: "offline", message: "Não foi possível confirmar a operação. Quando a conexão voltar, confira a sessão e tente novamente." };
  }
}

export async function createSession(input: CreateSessionInput, names?: Pick<SessionContext, "subjectName" | "topicName" | "plannedDurationMin">): Promise<SessionResult<ActiveSession>> {
  mutationRevision++;
  const result = await request<SessionPayload>(buildApiUrl(API_CONFIG.endpoints.sessions), { method: "POST", body: JSON.stringify(input) });
  if (result.status !== "ok") return result;
  const data = normalizeSession(result.data, { ...input, ...names, type: input.tipo });
  writeUserStorage("active_session_context", { id: data.id, ...input, ...names });
  writeUserStorage("active_session_clock", data);
  return { status: "ok", data };
}

export async function getActiveSession(): Promise<SessionResult<ActiveSession | null>> {
  const revision = mutationRevision;
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.endpoints.activeSession), { headers: getAuthHeader(), cache: "no-store" });
    if (response.status === 204) {
      if (revision === mutationRevision) {
        const previous = readUserStorage<ActiveSession>("active_session_clock");
        if (previous?.id) finishedSessions.add(previous.id);
        writeUserStorage("active_session_context", null);
        writeUserStorage("active_session_clock", null);
      }
      return { status: "ok", data: null };
    }
    if (response.status === 401) return { status: "unauthorized", message: "Sua sessão expirou." };
    if (!response.ok) return { status: "error", message: await readError(response) };
    const payload = await response.json() as SessionPayload;
    const cached = readUserStorage<SessionContext & { id: string }>("active_session_context");
    const clock = readUserStorage<ActiveSession>("active_session_clock");
    const raw = payload.sessao ?? payload;
    const context = cached && cached.id === raw.id ? cached : undefined;
    // A status changed elsewhere has no precise local timestamp. Only retain seconds for a matching snapshot.
    const matchingClock = clock && clock.id === raw.id && clock.status === raw.status ? clock : undefined;
    const data = normalizeSession(payload, { ...context, ...matchingClock });
    if (!isActiveSession(data) || finishedSessions.has(data.id)) {
      if (revision === mutationRevision) {
        writeUserStorage("active_session_context", null);
        writeUserStorage("active_session_clock", null);
      }
      return { status: "ok", data: null };
    }
    if (revision === mutationRevision) writeUserStorage("active_session_clock", data);
    return { status: "ok", data };
  } catch { return { status: "offline", message: "Não foi possível verificar a sessão ativa. Tente novamente quando houver conexão." }; }
}

export async function pauseSession(id: string, current?: ActiveSession): Promise<SessionResult<ActiveSession>> {
  if (finishedSessions.has(id) || (current && !isActiveSession(current))) return finishedSessionError;
  if (current && (current.id !== id || current.status !== "RUNNING")) return { status: "conflict", message: "Confira a sessão ativa antes de pausar." };
  mutationRevision++;
  const result = await request<SessionPayload>(buildApiUrl(`${API_CONFIG.endpoints.sessions}/${id}/pause`), { method: "PATCH" });
  if (result.status !== "ok") return result;
  if (finishedSessions.has(id)) return finishedSessionError;
  const data = normalizeSession(result.data, current ?? readUserStorage<ActiveSession>("active_session_clock") ?? undefined);
  if (data.id !== id || data.status !== "PAUSED") return { status: "conflict", message: "Não foi possível confirmar a pausa. Confira a sessão ativa." };
  writeUserStorage("active_session_clock", data);
  return { status: "ok", data };
}

export async function prepareSessionAssessment(current: ActiveSession): Promise<SessionResult<ActiveSession>> {
  if (finishedSessions.has(current.id) || !isActiveSession(current)) return finishedSessionError;
  return current.status === "PAUSED" ? { status: "ok", data: current } : pauseSession(current.id, current);
}

export async function resumeSession(id: string, current?: ActiveSession): Promise<SessionResult<ActiveSession>> {
  if (finishedSessions.has(id) || (current && !isActiveSession(current))) return finishedSessionError;
  if (current && (current.id !== id || current.status !== "PAUSED")) return { status: "conflict", message: "Confira a sessão ativa antes de retomar." };
  mutationRevision++;
  const result = await request<SessionPayload>(buildApiUrl(`${API_CONFIG.endpoints.sessions}/${id}/resume`), { method: "PATCH" });
  if (result.status !== "ok") return result;
  if (finishedSessions.has(id)) return finishedSessionError;
  const data = normalizeSession(result.data, current ?? readUserStorage<ActiveSession>("active_session_clock") ?? undefined);
  if (data.id !== id || data.status !== "RUNNING") return { status: "conflict", message: "Não foi possível confirmar a retomada. Confira a sessão ativa." };
  writeUserStorage("active_session_clock", data);
  return { status: "ok", data };
}
export async function finishSession(id: string, autoavaliacao: SelfAssessment, nota?: string) {
  if (finishedSessions.has(id)) return finishedSessionError;
  mutationRevision++;
  const result = await request<FinishedSession>(buildApiUrl(`${API_CONFIG.endpoints.sessions}/${id}/finish`), {
    method: "POST", body: JSON.stringify({ autoavaliacao, ...(nota?.trim() ? { nota: nota.trim() } : {}) }),
  });
  if (result.status === "ok") {
    finishedSessions.add(id);
    writeUserStorage("active_session_context", null);
    writeUserStorage("active_session_clock", null);
  }
  return result;
}
