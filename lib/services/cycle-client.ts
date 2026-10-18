import { API_CONFIG, getAuthHeader } from "@/lib/api-config";

export type CycleBlock = { id: string; ordem: number; subjectId: string; materia: string; topicId: string | null; assunto: string | null; duracaoMin: number; status: "pendente" | "concluido" };
export type CurrentCycle = { id: string; geradoEm: string; posicaoAtual: number; blocos: CycleBlock[] };

export type CycleResult = { status: "ok"; data: CurrentCycle } | { status: "unauthorized" | "empty" | "error"; message: string };

export async function updateCycleBlock(blockId: string, input: { duracaoMin?: number; ordem?: number }) {
  try {
    const response = await fetch(`/api/cycles/blocks/${encodeURIComponent(blockId)}`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", ...getAuthHeader() }, body: JSON.stringify(input),
    });
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    if (response.status === 401) return { status: "unauthorized" as const, message: "Sua sessão expirou." };
    if (!response.ok) return { status: "error" as const, message: payload?.message ?? "Não foi possível editar o bloco." };
    return { status: "ok" as const };
  } catch { return { status: "error" as const, message: "Não foi possível conectar ao backend." }; }
}

export async function declareTopicMastered(blockId: string) {
  try {
    const response = await fetch(`/api/cycles/blocks/${encodeURIComponent(blockId)}/complete`, {
      method: "POST", credentials: "include", headers: getAuthHeader(),
    });
    const payload = await response.json().catch(() => null) as { message?: string; xpGanho?: number; bloco?: CycleBlock } | null;
    if (response.status === 401) return { status: "unauthorized" as const, message: "Sua sessão expirou." };
    if (!response.ok || !payload?.bloco) return { status: "error" as const, message: payload?.message ?? "Não foi possível declarar o assunto como dominado." };
    return { status: "ok" as const, data: payload };
  } catch { return { status: "error" as const, message: "Não foi possível conectar ao backend." }; }
}

export async function fetchCurrentCycle(): Promise<CycleResult> {
  try {
    const response = await fetch("/api/cycles/current", { credentials: "include", headers: getAuthHeader() });
    const payload = (await response.json().catch(() => null)) as CurrentCycle | { message?: string } | null;
    if (response.status === 401) return { status: "unauthorized", message: "Sua sessão expirou." };
    if (response.status === 409) return { status: "empty", message: payload && "message" in payload ? payload.message ?? "Nenhum ciclo ativo encontrado." : "Nenhum ciclo ativo encontrado." };
    if (!response.ok || !payload || !("blocos" in payload)) return { status: "error", message: payload && "message" in payload ? payload.message ?? "Não foi possível carregar o ciclo." : "Não foi possível carregar o ciclo." };
    return { status: "ok", data: payload };
  } catch {
    return { status: "error", message: "Não foi possível conectar ao backend." };
  }
}

export async function generateCycle(): Promise<CycleResult> {
  try {
    const response = await fetch("/api/cycles", {
      method: "POST",
      credentials: "include",
      headers: { ...API_CONFIG.headers, ...getAuthHeader() },
    });
    const payload = (await response.json().catch(() => null)) as CurrentCycle | { message?: string } | null;
    if (response.status === 401) return { status: "unauthorized", message: "Sua sessão expirou." };
    if (response.status === 409) return { status: "empty", message: payload && "message" in payload ? payload.message ?? "Onboarding incompleto." : "Onboarding incompleto." };
    if (!response.ok || !payload || !("blocos" in payload)) return { status: "error", message: payload && "message" in payload ? payload.message ?? "Não foi possível gerar o ciclo." : "Não foi possível gerar o ciclo." };
    return { status: "ok", data: payload };
  } catch {
    return { status: "error", message: "Não foi possível conectar ao backend." };
  }
}
