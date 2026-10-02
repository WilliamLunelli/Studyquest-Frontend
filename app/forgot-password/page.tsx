"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AuthError, AuthInput } from "@/components/AuthFields";
import { requestPasswordResetClient } from "@/lib/services/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    const result = await requestPasswordResetClient(email);

    if (result.status === "success") {
      setSent(true);
    } else {
      setErrorMessage(result.message);
    }

    setIsLoading(false);
  }

  return (
    <AuthShell
      eyebrow="Recupere o acesso"
      title="Redefina sua senha"
      description="Informe o e-mail da sua conta. Enviaremos as instruções para você voltar aos estudos."
      backHref="/login"
    >
      {sent ? (
        <div className="space-y-5 rounded-3xl border border-[#c9a1f2] bg-[#f1e5f8] p-5 text-sm leading-6 text-[#6f2aa8]">
          <p>Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha.</p>
          <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#974FC9] px-5 font-semibold text-white">Voltar para o login</Link>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleRequest}>
          <AuthInput id="email" name="email" type="email" label="E-mail" placeholder="exemplo@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          <AuthError message={errorMessage} />
          <button type="submit" disabled={isLoading} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#974FC9] text-lg font-semibold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 sm:h-14 sm:text-[22px]">
            {isLoading ? "Enviando..." : "Enviar instruções"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
