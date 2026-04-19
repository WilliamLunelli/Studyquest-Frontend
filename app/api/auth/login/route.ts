import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json({ message: "Informe email e senha." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "Credenciais invalidas." }, { status: 401 });
    }

    const validPassword = await compare(password, user.password);

    if (!validPassword) {
      return NextResponse.json({ message: "Credenciais invalidas." }, { status: 401 });
    }

    const response = NextResponse.json({
      message: "Login realizado com sucesso.",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        level: user.level,
        xp: user.xp,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Erro no login." }, { status: 500 });
  }
}
