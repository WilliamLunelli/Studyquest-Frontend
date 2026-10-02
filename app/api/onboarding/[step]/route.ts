import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, buildApiUrl } from "@/lib/api-config";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";

const endpoints = {
  goal: API_CONFIG.endpoints.onboardingGoal,
  availability: API_CONFIG.endpoints.onboardingAvailability,
  difficulties: API_CONFIG.endpoints.onboardingDifficulties,
} as const;

export async function PUT(request: NextRequest, { params }: { params: Promise<{ step: string }> }) {
  const token = extractTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

  try {
    const { step } = await params;
    const endpoint = endpoints[step as keyof typeof endpoints];
    if (!endpoint) return NextResponse.json({ message: "Etapa de onboarding inválida." }, { status: 404 });
    const response = await fetch(buildApiUrl(endpoint), {
      method: "PUT",
      headers: { ...API_CONFIG.headers, Authorization: `Bearer ${token}` },
      body: await request.text(),
    });
    const payload = await response.json().catch(() => ({ message: "Resposta inválida do backend." }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Não foi possível salvar esta etapa." }, { status: 502 });
  }
}