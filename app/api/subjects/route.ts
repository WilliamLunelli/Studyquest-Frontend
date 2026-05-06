import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";
import { buildApiUrl, API_CONFIG } from "@/lib/api-config";

/**
 * Aggregate study sessions by subject
 */
function aggregateSubjectsBySession(sessions: Array<{ subjectId: string; studyTime: number }>) {
  const subjectMap = new Map<string, number>();

  for (const session of sessions) {
    const current = subjectMap.get(session.subjectId) || 0;
    subjectMap.set(session.subjectId, current + session.studyTime);
  }

  return Array.from(subjectMap.entries()).map(([subjectId, totalTime]) => ({
    subjectId,
    totalTime,
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
        { message: error.message ?? "Erro ao buscar registros." },
        { status: recordsResponse.status }
      );
    }

    const recordsData = (await recordsResponse.json()) as {
      sessions: Array<{ id: string; subjectId: string; studyTime: number; createdAt: string }>;
    };

    // Aggregate subjects from study sessions
    const subjects = aggregateSubjectsBySession(recordsData.sessions);

    return NextResponse.json(
      {
        message: "Subjects aggregated from study sessions.",
        subjects,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao carregar matérias.";
    return NextResponse.json({ message }, { status: 500 });
  }
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
