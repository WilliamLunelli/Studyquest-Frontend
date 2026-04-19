import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth-session";

const SUBJECT_GRADIENTS = [
  "from-[#ece4d8] via-[#f6efe3] to-[#d8c7ad]",
  "from-[#d6cec4] via-[#e8ddd1] to-[#bba692]",
  "from-[#e7dfd0] via-[#f4ecde] to-[#d4c19e]",
  "from-[#dbd4c9] via-[#ebe1d5] to-[#bca891]",
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

function getDateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function estimateSessionXp(studyTime: number, questions: number, rate: number) {
  return Math.round(studyTime / 3 + questions * 2 + rate * 10);
}

export async function GET(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);

    if (!userId) {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }

    const weekStart = getDateDaysAgo(7);
    const previousWeekStart = getDateDaysAgo(14);

    const [user, subjectRows, weeklySessions, previousWeeklySessions, badgeCountRows, topUsers] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          level: true,
          xp: true,
        },
      }),
      prisma.$queryRaw<
        Array<{ title: string; areaName: string; durationSeconds: number; sessionsCount: number }>
      >`SELECT s.subjectName AS title,
               a.areaName AS areaName,
               SUM(ss.studyTime) * 60 AS durationSeconds,
               COUNT(*) AS sessionsCount
        FROM StudySession ss
        INNER JOIN Subject s ON s.id = ss.subjectId
        INNER JOIN Area a ON a.id = s.areaId
        WHERE ss.userId = ${userId}
        GROUP BY ss.subjectId, s.subjectName, a.areaName
        ORDER BY durationSeconds DESC
        LIMIT 4`,
      prisma.$queryRaw<Array<{ studyTime: number; questions: number; rate: number }>>`
        SELECT studyTime, questions, rate
        FROM StudySession
        WHERE userId = ${userId} AND createdAt >= ${weekStart}
      `,
      prisma.$queryRaw<Array<{ studyTime: number; questions: number; rate: number }>>`
        SELECT studyTime, questions, rate
        FROM StudySession
        WHERE userId = ${userId} AND createdAt >= ${previousWeekStart} AND createdAt < ${weekStart}
      `,
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) AS count
        FROM UserBadge
        WHERE userId = ${userId}
      `,
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          level: true,
          xp: true,
        },
        orderBy: [
          { xp: "desc" },
          { level: "desc" },
          { createdAt: "asc" },
        ],
        take: 5,
      }),
    ]);

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    const pendingSubjects = subjectRows.map((subject, index) => ({
        title: normalizeSubjectTitle(subject.title),
        areaName: subject.areaName,
        meta: `${Number(subject.sessionsCount)} tópico${Number(subject.sessionsCount) > 1 ? "s" : ""} registrado${Number(subject.sessionsCount) > 1 ? "s" : ""}`,
        duration: formatDuration(Number(subject.durationSeconds)),
        gradient: SUBJECT_GRADIENTS[index % SUBJECT_GRADIENTS.length],
      }));

    const weeklyXp = weeklySessions.reduce(
      (accumulator, session) => accumulator + estimateSessionXp(session.studyTime, session.questions, session.rate),
      0,
    );

    const previousWeeklyXp = previousWeeklySessions.reduce(
      (accumulator, session) => accumulator + estimateSessionXp(session.studyTime, session.questions, session.rate),
      0,
    );

    const weeklyGrowth =
      previousWeeklyXp === 0
        ? weeklyXp > 0
          ? 100
          : 0
        : Math.round(((weeklyXp - previousWeeklyXp) / previousWeeklyXp) * 100);

    const badges = Number(badgeCountRows[0]?.count ?? 0);

    return NextResponse.json({
      user,
      stats: {
        weeklyTopics: weeklySessions.length,
        totalXp: user.xp,
        weeklyXp,
        weeklyGrowth,
        badges,
      },
      pendingSubjects,
      ranking: topUsers.map((entry) => ({
        id: entry.id,
        username: entry.username,
        level: entry.level,
        xp: entry.xp,
        isCurrentUser: entry.id === userId,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno no dashboard.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
