import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, buildApiUrl } from "@/lib/api-config";
import { extractTokenFromRequest } from "@/lib/jwt-middleware";

export async function GET(request: NextRequest) {
  const token = extractTokenFromRequest(request);

  if (!token) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const response = await fetch(buildApiUrl(API_CONFIG.endpoints.home), {
      headers: {
        ...API_CONFIG.headers,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Não foi possível conectar à Home." }, { status: 502 });
  }
}
