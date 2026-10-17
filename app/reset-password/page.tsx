"use client";

import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Redefinição indisponível"
      title="Este link não pode redefinir sua senha"
      description="O backend atual ainda não oferece redefinição de senha."
      backHref="/login"
    >
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <p role="status">Nenhuma alteração foi feita na sua conta. Entre em contato com a equipe do StudyQuest para recuperar o acesso.</p>
        <Link href="/login" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#974FC9] px-5 font-semibold text-white">Voltar para o login</Link>
      </div>
    </AuthShell>
  );
}
