import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";
import { buildApiUrl, API_CONFIG } from "@/lib/api-config";

type MeResponse = { objetivo: { id: string } | null };
type GoalWeight = { area: string; subjects: Array<{ id: string; nome: string }> };

export async function GET(request: NextRequest) {
  const token = extractTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

  const headers = { ...API_CONFIG.headers, Authorization: `Bearer ${token}` };
  try {
    const meResponse = await fetch(buildApiUrl(API_CONFIG.endpoints.me), { headers });
    if (meResponse.status === 401) return NextResponse.json({ message: "Token inválido." }, { status: 401 });
    if (!meResponse.ok) return NextResponse.json({ message: "Não foi possível carregar o usuário." }, { status: meResponse.status });

    const me = (await meResponse.json()) as MeResponse;
    if (!me.objetivo) return NextResponse.json({ message: "Defina um objetivo antes de carregar matérias.", subjects: [] });

    const weightsResponse = await fetch(buildApiUrl(`${API_CONFIG.endpoints.goals}/${me.objetivo.id}/weights`), { headers });
    const weights = (await weightsResponse.json()) as GoalWeight[] | { message?: string };
    if (!weightsResponse.ok) {
      return NextResponse.json({ message: "message" in weights ? weights.message : "Não foi possível carregar matérias." }, { status: weightsResponse.status });
    }

    const subjects = (weights as GoalWeight[]).flatMap((weight) => weight.subjects.map((subject) => ({
      subjectId: subject.id,
      title: subject.nome,
      areaName: weight.area,
      meta: `Área: ${weight.area}`,
      duration: "00:00:00",
      gradient: "from-[#ece4d8] via-[#f6efe3] to-[#d8c7ad]",
    })));

    return NextResponse.json({ message: "Subjects loaded from the active goal.", subjects }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao carregar matérias.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
