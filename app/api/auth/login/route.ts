import { NextResponse } from "next/server";
import { API_CONFIG, buildApiUrl } from "@/lib/api-config";

interface BackendLoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    avatar: string | null;
    bio: string | null;
    level: number;
    xp: number;
  };
}

interface BackendErrorResponse {
  error?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 400 });
    }

    // Call backend login endpoint
    const backendUrl = buildApiUrl(API_CONFIG.endpoints.login);
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: API_CONFIG.headers,
      body: JSON.stringify({ email, password }),
    });

    const backendData = (await backendResponse.json()) as BackendLoginResponse | BackendErrorResponse;

    // Forward backend response status and data
    if (!backendResponse.ok) {
      return NextResponse.json(backendData, { status: backendResponse.status });
    }

    // Success: return token and user for client to store
    return NextResponse.json(backendData, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao conectar com backend.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
