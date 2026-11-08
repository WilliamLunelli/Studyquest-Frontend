import { getAuthHeader } from "@/lib/api-config";

export async function fetchNextReview(topicId: string) {
  try {
    const response = await fetch(`/api/reviews?topicId=${encodeURIComponent(topicId)}`, { headers: getAuthHeader(), cache: "no-store" });
    if (!response.ok) return { status: "error" as const };
    const reviews = await response.json() as Array<{ reviewId: string; topicId: string; agendadaPara: string }>;
    return { status: "ok" as const, data: reviews[0] ?? null };
  } catch { return { status: "error" as const }; }
}

export type ReviewDetail = {
  reviewId: string;
  subjectId?: string;
  topicId?: string;
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
