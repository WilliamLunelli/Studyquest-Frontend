import { type SubjectCardData } from "@/lib/constants";
import {
  buildTempSubject,
  normalizeSubjectMeta,
  readTempSubjects,
  writeTempSubjects,
} from "@/lib/frontend/subjects";

type SubjectsApiResponse = {
  subjects?: SubjectCardData[];
  message?: string;
};

type SubjectsClientResult =
  | { status: "ok"; subjects: SubjectCardData[] }
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

    const apiSubjects = (payload.subjects ?? []).map(normalizeSubjectMeta);
    const tempSubjects = readTempSubjects().map(normalizeSubjectMeta);

    return {
      status: "ok",
      subjects: [...apiSubjects, ...tempSubjects],
    };
  } catch {
    return {
      status: "error",
      message: "Erro ao carregar matérias. Tente novamente.",
    };
  }
}

export function createTempSubjectClient(input: {
  subjectName: string;
  areaName: string;
}): SubjectCardData {
  const newSubject = buildTempSubject(input);
  const nextSubjects = [newSubject, ...readTempSubjects().map(normalizeSubjectMeta)];

  writeTempSubjects(nextSubjects);

  return newSubject;
}
