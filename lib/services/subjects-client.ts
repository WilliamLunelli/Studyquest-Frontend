import { type SubjectCardData } from "@/lib/constants";
import { getAuthHeader } from "@/lib/api-config";

type SubjectsApiResponse = {
  subjects?: Array<{ subjectId: string; totalTime: number }>;
  message?: string;
};

type SubjectsClientResult =
  | { status: "ok"; subjects: SubjectCardData[] }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

function formatDuration(totalMinutes: number): string {
  const safeSeconds = Math.max(0, totalMinutes * 60);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function mapApiSubjectToCard(input: { subjectId: string; totalTime: number }, index: number): SubjectCardData {
  const gradients = [
    "from-[#e7dfd0] via-[#f4ecde] to-[#d4c19e]",
    "from-[#dbd4c9] via-[#ebe1d5] to-[#bca891]",
    "from-[#ece4d8] via-[#f6efe3] to-[#d8c7ad]",
    "from-[#d6cec4] via-[#e8ddd1] to-[#bba692]",
  ];

  return {
    title: `Matéria ${input.subjectId.slice(0, 8)}`,
    areaName: "Linguagens",
    meta: "Tópicos registrados",
    duration: formatDuration(input.totalTime),
    gradient: gradients[index % gradients.length],
  };
}

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
      subjects: (payload.subjects ?? []).map(mapApiSubjectToCard),
    };
  } catch {
    return {
      status: "error",
      message: "Erro ao carregar matérias. Tente novamente.",
    };
  }
}
