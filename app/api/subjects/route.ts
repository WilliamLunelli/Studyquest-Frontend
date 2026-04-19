import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

const SUBJECT_GRADIENTS = [
  "from-[#e7dfd0] via-[#f4ecde] to-[#d4c19e]",
  "from-[#dbd4c9] via-[#ebe1d5] to-[#bca891]",
  "from-[#ece4d8] via-[#f6efe3] to-[#d8c7ad]",
  "from-[#d6cec4] via-[#e8ddd1] to-[#bba692]",
];

function normalizeSubjectTitle(title: string) {
  const displayTitles: Record<string, string> = {
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

  return displayTitles[title] ?? title;
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainingSeconds = safe % 60;

  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
}

async function buildSubjectsForUser(userId: string) {
  const subjectRows = await prisma.$queryRaw<Array<{ title: string; areaName: string; durationSeconds: number; sessionsCount: number }>>`
    SELECT s.subjectName AS title,
           a.areaName AS areaName,
           SUM(ss.studyTime) * 60 AS durationSeconds,
           COUNT(*) AS sessionsCount
    FROM StudySession ss
    INNER JOIN Subject s ON s.id = ss.subjectId
    INNER JOIN Area a ON a.id = s.areaId
    WHERE ss.userId = ${userId}
    GROUP BY ss.subjectId, s.subjectName, a.areaName
    ORDER BY durationSeconds DESC
  `;

  return subjectRows.map((subject, index) => ({
    title: normalizeSubjectTitle(subject.title),
    areaName: subject.areaName,
    meta: `${Number(subject.sessionsCount)} tópico${Number(subject.sessionsCount) > 1 ? "s" : ""} adicionado${Number(subject.sessionsCount) > 1 ? "s" : ""}`,
    duration: formatDuration(Number(subject.durationSeconds)),
    gradient: SUBJECT_GRADIENTS[index % SUBJECT_GRADIENTS.length],
  }));
}

export async function GET(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);

    if (!userId) {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }

    const subjects = await buildSubjectsForUser(userId);

    return NextResponse.json({ subjects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao carregar matérias.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);

    if (!userId) {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as {
      subjectName?: string;
      subjectDescription?: string;
      areaName?: string;
    };

    const subjectName = body.subjectName?.trim();
    const subjectDescription = body.subjectDescription?.trim();
    const areaName = body.areaName?.trim();

    if (!subjectName || !areaName) {
      return NextResponse.json({ message: "Informe o nome da matéria e a área." }, { status: 400 });
    }

    const area = await prisma.area.findUnique({
      where: { areaName },
    });

    if (!area) {
      return NextResponse.json({ message: "Área inválida." }, { status: 400 });
    }

    return NextResponse.json({
      subject: {
        subjectName: normalizeSubjectTitle(subjectName),
        subjectDescription: subjectDescription || null,
        areaName: area.areaName,
      },
      message: "Matéria salva apenas nesta sessão.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao registrar matéria.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
