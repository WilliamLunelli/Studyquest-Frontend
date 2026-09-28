import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, API_CONFIG } from "@/lib/api-config";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";

type BackendMe = { id: string; nome: string; email: string; xpTotal: number; nivel: number };
type BackendDashboard = {
  cobertura: { assuntosVistos: number };
  horasPorMateria: Array<{ materia: string; minutosReaisSemana: number }>;
};

const gradients = [
  "from-[#ece4d8] via-[#f6efe3] to-[#d8c7ad]",
  "from-[#d6cec4] via-[#e8ddd1] to-[#bba692]",
  "from-[#e7dfd0] via-[#f4ecde] to-[#d4c19e]",
  "from-[#dbd4c9] via-[#ebe1d5] to-[#bca891]",
];

function formatDuration(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(minutes));
  return [Math.floor(safeMinutes / 60), safeMinutes % 60, 0]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export async function GET(request: NextRequest) {
  const token = extractTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

  const headers = { ...API_CONFIG.headers, Authorization: `Bearer ${token}` };
  try {
    const meResponse = await fetch(buildApiUrl(API_CONFIG.endpoints.me), { headers });
    if (meResponse.status === 401) return NextResponse.json({ message: "Token inválido." }, { status: 401 });
    if (!meResponse.ok) return NextResponse.json({ message: "Não foi possível carregar o usuário." }, { status: meResponse.status });

    const user = (await meResponse.json()) as BackendMe;
    const dashboardResponse = await fetch(`${buildApiUrl(API_CONFIG.endpoints.dashboard)}?periodo=30d`, { headers });
    const dashboard = dashboardResponse.ok ? ((await dashboardResponse.json()) as BackendDashboard) : null;
    const pendingSubjects = (dashboard?.horasPorMateria ?? []).map((subject, index) => ({
      title: subject.materia,
      meta: "Dados do ciclo atual",
      duration: formatDuration(subject.minutosReaisSemana),
      gradient: gradients[index % gradients.length],
    }));

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.nome, level: user.nivel, xp: user.xpTotal },
      stats: { weeklyTopics: dashboard?.cobertura.assuntosVistos ?? 0, totalXp: user.xpTotal, weeklyXp: 0, weeklyGrowth: 0, badges: 0 },
      pendingSubjects,
      ranking: [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao carregar dashboard.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
