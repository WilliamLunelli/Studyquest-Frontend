import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, buildApiUrl } from "@/lib/api-config";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";

export async function GET(request: NextRequest) {
  const token = extractTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

  try {
    const response = await fetch(buildApiUrl(`${API_CONFIG.endpoints.cycles}/current`), { headers: { ...API_CONFIG.headers, Authorization: `Bearer ${token}` }, cache: "no-store" });
    const payload = await response.json().catch(() => ({ message: "Resposta inválida do backend." }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Não foi possível carregar o ciclo." }, { status: 502 });
  }
}