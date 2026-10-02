import { getAuthHeader } from "@/lib/api-config";

export type CycleBlock = { id: string; ordem: number; subjectId: string; materia: string; topicId: string | null; assunto: string | null; duracaoMin: number; status: "pendente" | "concluido" };
export type CurrentCycle = { id: string; geradoEm: string; posicaoAtual: number; blocos: CycleBlock[] };

export type CycleResult = { status: "ok"; data: CurrentCycle } | { status: "unauthorized" | "empty" | "error"; message: string };

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