import { NextResponse } from "next/server";
import { API_CONFIG, buildApiUrl } from "@/lib/api-config";

export async function proxyAuthRequest(request: Request, endpoint: string) {
  try {
    const body = await request.text();
    const backendResponse = await fetch(buildApiUrl(endpoint), {
      method: "POST",
      headers: API_CONFIG.headers,
      body,
    });
    const contentType = backendResponse.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await backendResponse.json()
      : { message: await backendResponse.text() };

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ message: "Erro ao conectar com backend." }, { status: 500 });
  }
}
