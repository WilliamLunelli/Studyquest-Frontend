import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, buildApiUrl } from "@/lib/api-config";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";

export async function GET(request: NextRequest) {
  const token = extractTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

  const tipo = request.nextUrl.searchParams.get("tipo");
  const endpoint = tipo ? `${API_CONFIG.endpoints.goals}?tipo=${encodeURIComponent(tipo)}` : API_CONFIG.endpoints.goals;

  try {
    const response = await fetch(buildApiUrl(endpoint), { headers: { ...API_CONFIG.headers, Authorization: `Bearer ${token}` }, cache: "no-store" });
    const payload = await response.json().catch(() => ({ message: "Resposta inválida do backend." }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Não foi possível carregar os objetivos." }, { status: 502 });
  }
}