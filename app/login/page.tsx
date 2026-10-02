"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AuthError, AuthInput, PasswordInput } from "@/components/AuthFields";
import { loginClient } from "@/lib/services/login-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const result = await loginClient(email, password);

    if (result.status === "success") {
      router.push(result.data.user.onboardingCompleto ? "/dashboard" : "/onboarding");
    } else {
      setErrorMessage(result.message);
    }

    setIsLoading(false);
  }

  return (
    <AuthShell
      eyebrow="Sua jornada continua"
      title="Bem-vindo de volta!"
      description={
        <>
          Ainda não tem uma conta?{" "}
          <Link href="/register" className="font-medium text-slate-700 underline underline-offset-2">
            Cadastre-se
          </Link>
        </>
      }
      footer={
        <>
          <span>Esqueceu sua senha?</span>{" "}
          <Link href="/forgot-password" className="font-medium text-slate-700 underline underline-offset-2">
            Redefinir agora
          </Link>
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleLogin}>
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="E-mail"
          placeholder="exemplo@gmail.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <PasswordInput
          id="password"
          name="password"
          label="Senha"
          placeholder="Digite sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        <AuthError message={errorMessage} />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#974FC9] text-lg font-semibold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 sm:h-14 sm:text-[22px]"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </AuthShell>
  );
}
