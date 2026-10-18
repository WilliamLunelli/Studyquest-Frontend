import { getAuthHeader } from "@/lib/api-config";

export type HomeBlock = {
  blocoId: string;
  materia: string;
  assunto: string | null;
  duracaoMin: number;
  tipoSugerido: "teoria" | "questoes" | "revisao";
  ordem?: number;
  totalBlocos?: number;
  area?: string;
  peso?: number;
};

export type HomeReview = {
  reviewId: string;
  materia: string;
  assunto: string;
  agendadaPara: string;
  multiplicadorXp: 1 | 2;
  atrasada: boolean;
};

export type HomePayload = {
  user?: { nome?: string; email?: string };
  proximoBloco: HomeBlock | null;
  revisoesHoje: HomeReview[];
  streak: {
    atual: number;
    recorde: number;
    escudosDisponiveis: number;
    metaDiariaMin: number;
    minutosHoje: number;
    metaCumprida: boolean;
  };
  xp: {
    total: number;
    nivel: number;
    titulo: string;
    xpNoNivel: number;
    xpParaProximoNivel: number;
  };
  estudandoAgora: number;
};

type HomeResult =
  | { status: "ok"; data: HomePayload }
  | { status: "empty"; message: string }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

export async function fetchHomeClient(): Promise<HomeResult> {
  try {
    const response = await fetch("/api/home", {
      credentials: "include",
      headers: getAuthHeader(),
    });

    if (response.status === 401) return { status: "unauthorized" };

    const payload = (await response.json().catch(() => null)) as { message?: string } & Partial<HomePayload>;

    if (response.status === 409 || !response.ok && response.status === 404) {
      return { status: "empty", message: payload.message ?? "Seu ciclo de estudos ainda está vazio." };
    }

    if (!response.ok) {
      return { status: "error", message: payload.message ?? "Não foi possível carregar sua Home." };
    }

    return { status: "ok", data: payload as HomePayload };
  } catch {
    return { status: "error", message: "Erro ao carregar sua Home. Tente novamente." };
  }
}
