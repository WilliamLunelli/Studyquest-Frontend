import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, buildApiUrl } from "@/lib/api-config";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  try {
    const { id } = await params;
    const response = await fetch(buildApiUrl(`${API_CONFIG.endpoints.cycles}/blocks/${id}/complete`), {
      method: "POST", headers: { ...API_CONFIG.headers, Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    const payload = await response.json().catch(() => ({ message: "Resposta inválida do backend." }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Não foi possível concluir o assunto." }, { status: 502 });
  }
}
