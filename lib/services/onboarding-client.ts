import { getAuthHeader } from "@/lib/api-config";

export type Goal = { id: string; tipo: string; nome: string; instituicao: string | null };
export type GoalWeight = { areaId: string; area: string; peso: number; subjects: Array<{ id: string; nome: string }> };
export type AvailabilityDay = { diaSemana: number; minutos: number };

type ClientResult<T = null> = { status: "ok"; data: T } | { status: "unauthorized" | "error"; message: string };

async function request<T>(path: string, init?: RequestInit): Promise<ClientResult<T>> {
  try {
    const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...getAuthHeader(), ...init?.headers } });
    const payload = (await response.json().catch(() => null)) as T & { message?: string } | null;
    if (response.status === 401) return { status: "unauthorized", message: "Sua sessão expirou." };
    if (!response.ok) return { status: "error", message: payload?.message ?? "Não foi possível salvar esta etapa." };
    return { status: "ok", data: payload as T };
  } catch {
    return { status: "error", message: "Não foi possível conectar ao backend." };
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
  return request("/api/onboarding/availability", { method: "PUT", body: JSON.stringify({ disponibilidade }) });
}

export function saveDifficulties(dificuldades: Array<{ subjectId: string; nivel: number }>) {
  return request("/api/onboarding/difficulties", { method: "PUT", body: JSON.stringify({ dificuldades }) });
}