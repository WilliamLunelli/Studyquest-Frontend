import { type SubjectCardData } from "@/lib/constants";
import { normalizeSubjectMeta } from "@/lib/frontend/subjects";

type SubjectsApiResponse = {
  subjects?: Array<{ subjectId: string; totalTime: number }>;
  message?: string;
};

type SubjectsClientResult =
  | { status: "ok"; subjects: Array<{ subjectId: string; totalTime: number }> }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

export async function fetchSubjectsClient(): Promise<SubjectsClientResult> {
  try {
    const response = await fetch("/api/subjects", {
      credentials: "include",
    });

    if (response.status === 401) {
      return { status: "unauthorized" };
    }

    const payload = (await response.json()) as SubjectsApiResponse;

    if (!response.ok) {
      return {
        status: "error",
        message: payload.message ?? "Não foi possível carregar suas matérias.",
      };
    }

    return {
      status: "ok",
      subjects: payload.subjects ?? [],
    };
  } catch {
    return {
      status: "error",
      message: "Erro ao carregar matérias. Tente novamente.",
    };
  }
}
