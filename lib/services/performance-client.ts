import { getAuthHeader } from "@/lib/api-config";

export type PerformanceMetrics = {
  cobertura: { assuntosTotais: number; assuntosVistos: number; percentual: number };
  horasPorMateria: Array<{ subjectId: string; materia: string; peso: number; minutosIdeaisSemana: number; minutosReaisSemana: number; desvioPercentual: number; status: string }>;
  acertoPorAssunto: Array<{ topicId: string; assunto: string; materia: string; feitas: number; acertadas: number; percentual: number }>;
  excessoConfianca: Array<{ topicId: string; assunto: string; materia: string; autoavaliacoesTranquilo: number; percentualAcerto: number; revisaoAntecipada: boolean }>;
  streak: { atual: number; recorde: number; escudosDisponiveis: number };
  aderenciaCiclo: { blocosPlanejados: number; blocosConcluidos: number; percentual: number };
};

type PerformanceResult =
  | { status: "ok"; data: PerformanceMetrics }
  | { status: "unauthorized" | "empty" | "error"; message: string };

export async function fetchPerformance(periodo: "7d" | "30d" | "90d" = "7d"): Promise<PerformanceResult> {
  try {
    const response = await fetch(`/api/dashboard?periodo=${periodo}`, { credentials: "include", headers: getAuthHeader() });
    const payload = (await response.json().catch(() => null)) as { dashboard?: PerformanceMetrics; message?: string } | null;

    if (response.status === 401) return { status: "unauthorized", message: "Sua sessão expirou." };
    if (!response.ok) return { status: "error", message: payload?.message ?? "Não foi possível carregar seu desempenho." };
    if (!payload?.dashboard) return { status: "empty", message: "O backend ainda não enviou dados de desempenho." };

    return { status: "ok", data: payload.dashboard };
  } catch {
    return { status: "error", message: "Não foi possível conectar ao backend." };
  }
}