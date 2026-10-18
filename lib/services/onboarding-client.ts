import { getAuthHeader } from "@/lib/api-config";
import { getCurrentUser } from "@/lib/jwt-auth";

export type Goal = { id: string; tipo: string; nome: string; instituicao: string | null };
export type GoalWeight = { areaId: string; area: string; peso: number; subjects: Array<{ id: string; nome: string }> };
export type AvailabilityDay = { diaSemana: number; minutos: number };
export const AVAILABILITY_STORAGE_KEY = "studyquest_availability";

export function getAvailabilityStorageKey() {
  const userId = getCurrentUser()?.id;
  return userId ? `${AVAILABILITY_STORAGE_KEY}:${userId}` : null;
}

type ClientResult<T = null> = { status: "ok"; data: T } | { status: "unauthorized" | "error"; message: string };

async function request<T>(path: string, init?: RequestInit): Promise<ClientResult<T>> {
  try {
    const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...getAuthHeader(), ...init?.headers } });
    const payload = (await response.json().catch(() => null)) as T & { message?: string } | null;
    if (response.status === 401) return { status: "unauthorized", message: "Sua sessão expirou." };
    if (!response.ok) return { status: "error", message: payload?.message ?? "Não foi possível salvar esta etapa." };
    return { status: "ok", data: payload as T };
  } catch {
    return { status: "error", message: "Não foi possível conectar agora. Verifique sua conexão e tente novamente." };
  }
}

export function fetchGoals() {
  return request<Goal[]>("/api/goals");
}

export function fetchGoalWeights(goalId: string) {
  return request<GoalWeight[]>(`/api/goals/${goalId}/weights`);
}

export function saveOnboardingGoal(goalId: string) {
  return request("/api/onboarding/goal", { method: "PUT", body: JSON.stringify({ goalId }) });
}

export function saveAvailability(disponibilidade: AvailabilityDay[]) {
  return request("/api/onboarding/availability", { method: "PUT", body: JSON.stringify({ disponibilidade }) }).then((result) => {
    const storageKey = getAvailabilityStorageKey();
    if (result.status === "ok" && storageKey && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(disponibilidade));
      } catch {
        // A persistência no backend continua válida se o navegador bloquear o localStorage.
      }
    }
    return result;
  });
}

export function saveDifficulties(dificuldades: Array<{ subjectId: string; nivel: number }>) {
  return request("/api/onboarding/difficulties", { method: "PUT", body: JSON.stringify({ dificuldades }) });
}
