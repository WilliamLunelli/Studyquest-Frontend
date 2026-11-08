import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, buildApiUrl } from "@/lib/api-config";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

  try {
    const { id } = await params;
    const response = await fetch(buildApiUrl(`${API_CONFIG.endpoints.reviews}/${id}`), {
      headers: { ...API_CONFIG.headers, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    if (response.ok) {
      // The detail contract omits identifiers; existing review lists expose them even outside the current cycle.
      const lists = await Promise.allSettled(["/today", "/upcoming?dias=60"].map(async (suffix) => {
        const listResponse = await fetch(buildApiUrl(`${API_CONFIG.endpoints.reviews}${suffix}`), {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        if (!listResponse.ok) return [];
        const items = await listResponse.json();
        return Array.isArray(items) ? items as Array<{ reviewId: string; subjectId: string; topicId: string }> : [];
      }));
      const identity = lists.flatMap((result) => result.status === "fulfilled" ? result.value : []).find((item) => item.reviewId === id);
      return NextResponse.json({ ...payload, ...(identity ? { subjectId: identity.subjectId, topicId: identity.topicId } : {}) });
    }
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Não foi possível carregar a revisão." }, { status: 502 });
  }
}
