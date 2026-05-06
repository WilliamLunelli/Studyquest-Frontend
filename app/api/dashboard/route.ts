import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";
import { buildApiUrl, API_CONFIG } from "@/lib/api-config";

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

    const recordsData = (await recordsResponse.json()) as {
      sessions: Array<{
        id: string;
        userId: string;
        subjectId: string;
        studyTime: number;
        questions: number;
        rate: number;
        createdAt: string;
      }>;
    };

    // TODO: Process sessions to build dashboard stats
    // For now, return raw sessions as placeholder
    return NextResponse.json(
      {
        message: "Dashboard data fetched successfully.",
        sessions: recordsData.sessions,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao carregar dashboard.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
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
