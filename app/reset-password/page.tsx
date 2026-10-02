"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AuthError, PasswordInput } from "@/components/AuthFields";
import { resetPasswordClient } from "@/lib/services/auth-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const token = searchParams.get("token") ?? "";

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmation) {
      setErrorMessage("As senhas precisam ser iguais.");
      return;
    }

    setIsLoading(true);
    const result = await resetPasswordClient(token, password);

    if (result.status === "success") {
      setCompleted(true);
    } else {
      setErrorMessage(result.message);
    }

    setIsLoading(false);
  }

  return (
    <AuthShell
      eyebrow="Quase lá"
      title="Crie uma nova senha"
      description="Escolha uma senha segura para continuar sua jornada no StudyQuest."
      backHref="/login"
    >
      {completed ? (
        <div className="space-y-5 rounded-3xl border border-[#c9a1f2] bg-[#f1e5f8] p-5 text-sm leading-6 text-[#6f2aa8]">
          <p>Sua senha foi atualizada. Agora você já pode entrar novamente.</p>
          <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#974FC9] px-5 font-semibold text-white">Ir para o login</Link>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleReset}>
          <PasswordInput id="password" name="password" label="Nova senha" placeholder="Mínimo de 8 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
          <PasswordInput id="confirmation" name="confirmation" label="Confirme sua senha" placeholder="Digite novamente" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required />
          <AuthError message={errorMessage} />
          <button type="submit" disabled={isLoading} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#974FC9] text-lg font-semibold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 sm:h-14 sm:text-[22px]">
            {isLoading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordForm /></Suspense>;
}
