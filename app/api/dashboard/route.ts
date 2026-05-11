import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";
import { buildApiUrl, API_CONFIG } from "@/lib/api-config";

type StudySession = {
  id: string;
  userId: string;
  subjectId: string;
  studyTime: number;
  questions: number;
  rate: number;
  createdAt: string;
};

function formatDuration(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainingSeconds = safe % 60;

  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function estimateSessionXp(studyTime: number, questions: number, rate: number) {
  return Math.round(studyTime / 3 + questions * 2 + rate * 10);
}

function buildPendingSubjects(sessions: StudySession[]) {
  const bySubject = new Map<string, { seconds: number; count: number }>();

  for (const session of sessions) {
    const current = bySubject.get(session.subjectId) ?? { seconds: 0, count: 0 };
    bySubject.set(session.subjectId, {
      seconds: current.seconds + session.studyTime * 60,
      count: current.count + 1,
    });
  }

  return Array.from(bySubject.entries())
    .sort((a, b) => b[1].seconds - a[1].seconds)
    .slice(0, 6)
    .map(([subjectId, value], index) => ({
      title: `Matéria ${subjectId.slice(0, 8)}`,
      areaName: "Linguagens",
      meta: `${value.count} tópico${value.count > 1 ? "s" : ""} registrado${value.count > 1 ? "s" : ""}`,
      duration: formatDuration(value.seconds),
      gradient:
        [
          "from-[#ece4d8] via-[#f6efe3] to-[#d8c7ad]",
          "from-[#d6cec4] via-[#e8ddd1] to-[#bba692]",
          "from-[#e7dfd0] via-[#f4ecde] to-[#d4c19e]",
          "from-[#dbd4c9] via-[#ebe1d5] to-[#bca891]",
        ][index % 4],
    }));
}

export async function GET(request: NextRequest) {
  try {
    // Extract JWT from Authorization header
    const token = extractTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }

    // Call backend to get records
    const recordsUrl = buildApiUrl(API_CONFIG.endpoints.records);
    const recordsResponse = await fetch(recordsUrl, {
      method: "GET",
      headers: {
        ...API_CONFIG.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (recordsResponse.status === 401) {
      return NextResponse.json({ message: "Token inválido." }, { status: 401 });
    }

    if (!recordsResponse.ok) {
      const error = (await recordsResponse.json()) as { message?: string };
      return NextResponse.json(
        { message: error.message ?? "Erro ao buscar registros no backend." },
        { status: recordsResponse.status }
      );
    }

    const recordsData = (await recordsResponse.json()) as { sessions: StudySession[] };
    const sessions = recordsData.sessions ?? [];

    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const previousWeekStart = now - 2 * weekMs;
    const currentWeekStart = now - weekMs;

    const weeklySessions = sessions.filter((session) => new Date(session.createdAt).getTime() >= currentWeekStart);
    const previousWeeklySessions = sessions.filter((session) => {
      const createdAt = new Date(session.createdAt).getTime();
      return createdAt >= previousWeekStart && createdAt < currentWeekStart;
    });

    const weeklyXp = weeklySessions.reduce(
      (accumulator, session) => accumulator + estimateSessionXp(session.studyTime, session.questions, session.rate),
      0,
    );
    const previousWeeklyXp = previousWeeklySessions.reduce(
      (accumulator, session) => accumulator + estimateSessionXp(session.studyTime, session.questions, session.rate),
      0,
    );
    const totalXp = sessions.reduce(
      (accumulator, session) => accumulator + estimateSessionXp(session.studyTime, session.questions, session.rate),
      0,
    );

    const weeklyGrowth =
      previousWeeklyXp === 0 ? (weeklyXp > 0 ? 100 : 0) : Math.round(((weeklyXp - previousWeeklyXp) / previousWeeklyXp) * 100);

    return NextResponse.json({
      user: {
        id: "local-user",
        email: "",
        username: "Estudante",
        level: Math.max(1, Math.floor(totalXp / 500) + 1),
        xp: totalXp,
      },
      stats: {
        weeklyTopics: weeklySessions.length,
        totalXp,
        weeklyXp,
        weeklyGrowth,
        badges: 0,
      },
      pendingSubjects: buildPendingSubjects(sessions),
      ranking: [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao carregar dashboard.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
