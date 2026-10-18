import { getAuthHeader } from "@/lib/api-config";

export type ReviewDetail = {
  reviewId: string;
  materia: string;
  assunto: string;
  repeticao: number;
  roteiro: {
    aviso: string;
    prompts: string[];
  };
};

export type ReviewDetailResult =
  | { status: "ok"; data: ReviewDetail }
  | { status: "unauthorized" | "error"; message: string };

export async function fetchReviewDetail(reviewId: string): Promise<ReviewDetailResult> {
  try {
    const response = await fetch(`/api/reviews/${reviewId}`, { credentials: "include", headers: getAuthHeader() });
    const payload = (await response.json().catch(() => null)) as ReviewDetail | { message?: string } | null;

    if (response.status === 401) return { status: "unauthorized", message: "Sua sessão expirou." };
    if (!response.ok || !payload || !("roteiro" in payload)) {
      return { status: "error", message: payload && "message" in payload ? payload.message ?? "Não foi possível carregar a revisão." : "Não foi possível carregar a revisão." };
    }

    return { status: "ok", data: payload };
  } catch {
    return { status: "error", message: "Não foi possível carregar a revisão." };
  }
}