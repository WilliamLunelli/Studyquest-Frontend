"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AuthError, AuthInput, PasswordInput } from "@/components/AuthFields";
import { registerClient } from "@/lib/services/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    const result = await registerClient(name, email, password);

    if (result.status === "success") {
      router.push("/login");
    } else {
      setErrorMessage(result.message);
    }

    setIsLoading(false);
  }

  return (
    <AuthShell
      eyebrow="Comece agora"
      title="Crie sua conta"
      description={
        <>
          Monte seu ciclo de estudos e acompanhe cada conquista. Já possui uma conta?{" "}
          <Link href="/login" className="font-medium text-slate-700 underline underline-offset-2">Entre</Link>
        </>
      }
      backHref="/login"
    >
      <form className="space-y-6" onSubmit={handleRegister}>
        <AuthInput id="name" name="name" label="Nome" placeholder="Como podemos chamar você?" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
        <AuthInput id="email" name="email" type="email" label="E-mail" placeholder="exemplo@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        <PasswordInput id="password" name="password" label="Crie uma senha" placeholder="Mínimo de 8 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
        <AuthError message={errorMessage} />
        <button type="submit" disabled={isLoading} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#974FC9] text-lg font-semibold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 sm:h-14 sm:text-[22px]">
          {isLoading ? "Criando..." : "Criar conta"}
        </button>
      </form>
    </AuthShell>
  );
}
