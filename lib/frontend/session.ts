export type SessionType = "TEORIA" | "QUESTOES" | "REVISAO";
export type SessionPreset = "P25_5" | "P50_10" | "LIVRE";
export type SessionStatus = "RUNNING" | "PAUSED" | "FINISHED" | "ABANDONED";
export type SelfAssessment = "travei" | "ok" | "tranquilo";

export type SessionContext = {
  subjectId: string;
  topicId: string;
  subjectName?: string;
  topicName?: string;
  blocoId?: string;
  reviewId?: string;
  plannedDurationMin?: number;
};

export type ActiveSession = SessionContext & {
  id: string;
  userId?: string;
  type: SessionType;
  preset: SessionPreset;
  status: SessionStatus;
  startedAt: string;
  /** Local receipt time: the API's accumulated minutes already include the running segment. */
  observedAt: number;
  /** Local elapsed time for display; never sent as study time or used to grant XP. */
  displaySecondsAtObservation?: number;
  minutosAcumulados: number;
  duracaoAlvoMin: number | null;
};

export type SessionPayload = Partial<ActiveSession> & {
  tipo?: SessionType;
  sessao?: Partial<ActiveSession> & { tipo?: SessionType };
};

export function isActiveSession(session: ActiveSession | null | undefined): session is ActiveSession {
  return session?.status === "RUNNING" || session?.status === "PAUSED";
}

export function presetForBlockDuration(minutes: number): SessionPreset {
  return minutes === 25 ? "P25_5" : minutes === 50 ? "P50_10" : "LIVRE";
}

export function normalizeSession(payload: SessionPayload, fallback?: Partial<ActiveSession>, now = Date.now()): ActiveSession {
  const raw = payload.sessao ?? payload;
  if (raw.id && fallback?.id && raw.id !== fallback.id) fallback = undefined;
  const preset = raw.preset ?? fallback?.preset ?? "P50_10";
  const minutes = raw.minutosAcumulados ?? fallback?.minutosAcumulados ?? 0;
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
  const sameSession = Boolean(raw.id && raw.id === fallback?.id);
  const localSeconds = sameSession && Number.isFinite(fallback?.observedAt)
    ? elapsedSessionSeconds(fallback as ActiveSession, now)
    : 0;
  return {
    ...fallback,
    ...raw,
    id: raw.id ?? fallback?.id ?? "",
    subjectId: raw.subjectId ?? fallback?.subjectId ?? "",
    topicId: raw.topicId ?? fallback?.topicId ?? "",
    type: raw.type ?? raw.tipo ?? fallback?.type ?? "TEORIA",
    preset,
    status: raw.status ?? fallback?.status ?? "RUNNING",
    startedAt: raw.startedAt ?? fallback?.startedAt ?? new Date(now).toISOString(),
    observedAt: now,
    minutosAcumulados: safeMinutes,
    displaySecondsAtObservation: Math.max(safeMinutes * 60, localSeconds),
    duracaoAlvoMin: preset === "LIVRE" ? null : raw.duracaoAlvoMin ?? fallback?.duracaoAlvoMin ?? (preset === "P25_5" ? 25 : 50),
  };
}

export function elapsedSessionSeconds(session: ActiveSession, now = Date.now()) {
  const base = Math.max(session.minutosAcumulados * 60, session.displaySecondsAtObservation ?? 0);
  return base + (session.status === "RUNNING" ? Math.max(0, Math.floor((now - session.observedAt) / 1000)) : 0);
}

export function validateQuestionCounts(done: string, correct: string): string | null {
  if (!done.trim() && !correct.trim()) return null;
  const total = Number(done);
  const hits = Number(correct || 0);
  return !done.trim() || !correct.trim() || !Number.isInteger(total) || total < 1 || total > 500 || !Number.isInteger(hits) || hits < 0 || hits > total
    ? "Informe de 1 a 500 questões e um número inteiro de acertos entre zero e o total feito."
    : null;
}
