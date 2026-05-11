import { type SubjectCardData } from "@/lib/constants";

export type SubjectAreaFilter = "Todas" | "Humanas" | "Exatas";

const subjectTitleAliases: Record<string, string> = {
  Literatura: "Literatura",
  "Producao de texto": "Produção de texto",
  "Produção de texto": "Produção de texto",
  Matematica: "Matemática",
  Matemática: "Matemática",
  Historia: "História",
  História: "História",
  Geografia: "Geografia",
  Biologia: "Biologia",
  Quimica: "Química",
  Química: "Química",
};

const areaBySubject: Record<string, string> = {
  Literatura: "Humanas",
  "Produção de texto": "Humanas",
  Matemática: "Exatas",
  Biologia: "Humanas",
  Química: "Exatas",
  História: "Humanas",
  Geografia: "Humanas",
};

export function normalizeSubjectTitle(title: string) {
  return subjectTitleAliases[title] ?? title;
}

export function inferAreaName(title: string) {
  const normalizedTitle = normalizeSubjectTitle(title);
  return areaBySubject[normalizedTitle] ?? "Linguagens";
}

export function normalizeSubjectMeta(subject: SubjectCardData): SubjectCardData {
  const normalized: SubjectCardData = {
    ...subject,
    title: normalizeSubjectTitle(subject.title),
    areaName: subject.areaName ?? inferAreaName(subject.title),
  };

  if (normalized.duration === "00:00:00") {
    return {
      ...normalized,
      meta: "0 tópicos adicionados",
    };
  }

  return normalized;
}

export function matchesSubjectFilter(areaName: string | undefined, filter: SubjectAreaFilter) {
  if (filter === "Todas") {
    return true;
  }

  if (filter === "Humanas") {
    return areaName === "Humanas" || areaName === "Linguagens";
  }

  return areaName === filter;
}
