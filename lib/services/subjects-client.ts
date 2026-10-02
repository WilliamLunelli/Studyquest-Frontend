import { getAuthHeader } from "@/lib/api-config";
import { type SubjectCardData } from "@/lib/frontend/subjects";

type SubjectsApiResponse = {
  subjects?: Array<SubjectCardData & { subjectId: string }>;
  message?: string;
};

type SubjectsClientResult =
  | { status: "ok"; subjects: SubjectCardData[] }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

export async function fetchSubjectsClient(): Promise<SubjectsClientResult> {
  try {
    const authHeader = getAuthHeader();

    const response = await fetch("/api/subjects", {
      credentials: "include",
      headers: {
        ...authHeader,
      },
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
      subjects: (payload.subjects ?? []).map(({ subjectId: _subjectId, ...subject }) => subject),
    };
  } catch {
    return {
      status: "error",
      message: "Erro ao carregar matérias. Tente novamente.",
    };
  }
}
