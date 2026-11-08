import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, buildApiUrl } from "@/lib/api-config";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";

export async function GET(request: NextRequest) {
  const token = extractTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  try {
    const responses = await Promise.all(["/today", "/upcoming?dias=60"].map((suffix) => fetch(buildApiUrl(`${API_CONFIG.endpoints.reviews}${suffix}`), {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    })));
    const failed = responses.find((response) => !response.ok);
    if (failed) return NextResponse.json(await failed.json().catch(() => ({ message: "Não foi possível atualizar a data da revisão." })), { status: failed.status });
    const lists = await Promise.all(responses.map((response) => response.json())) as Array<Array<{ reviewId: string; topicId: string; agendadaPara: string }>>;
    const topicId = request.nextUrl.searchParams.get("topicId");
    const reviews = [...new Map(lists.flat().map((review) => [review.reviewId, review])).values()]
      .filter((review) => !topicId || review.topicId === topicId)
      .sort((a, b) => Date.parse(a.agendadaPara) - Date.parse(b.agendadaPara));
    return NextResponse.json(reviews);
  } catch { return NextResponse.json({ message: "Não foi possível atualizar a data da revisão." }, { status: 502 }); }
}
