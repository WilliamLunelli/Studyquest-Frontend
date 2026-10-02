"use client";

import Link from "next/link";
import { ArrowLeft, Check, Lightbulb } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { fetchHomeClient } from "@/lib/services/home-client";
import { fetchReviewDetail, type ReviewDetail } from "@/lib/services/reviews-client";
import { ThemeToggle } from "@/components/ThemeToggle";

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("reviewId");
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [remembered, setRemembered] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!reviewId) {
      setIsLoading(false);
      return;
    }

    void fetchReviewDetail(reviewId).then((result) => {
      if (result.status === "ok") setReview(result.data);
      else setError(result.message);
      setIsLoading(false);
    });
  }, [reviewId]);

  useEffect(() => {
    void fetchHomeClient().then((result) => {
      if (result.status === "ok") setStreak(result.data.streak.atual);
    });
  }, []);

  function toggleRemembered(index: number) {
    setRemembered((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  }

  if (isLoading) return <ReviewState title="Carregando revisão" message="Aguardando o roteiro do backend." />;
  if (!review) return <ReviewState title="Revisão aguardando dados" message={error || "O backend ainda não enviou uma revisão para esta tela."} />;

  return (
    <main className="min-h-screen bg-page pb-32 text-foreground">
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-7 sm:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-7">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" aria-label="Voltar para a Home" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white transition hover:brightness-95"><ArrowLeft aria-hidden="true" size={25} /></Link>
            <span className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">StudyQuest</span>
          </div>
          <div className="flex items-center gap-2"><span className="shrink-0 rounded-full border border-border bg-surface-muted px-4 py-3 text-sm font-semibold text-muted sm:text-base">Sequência: {streak} dias</span><ThemeToggle /></div>
        </header>

        <section className="mt-8">
          <p className="text-base font-semibold uppercase tracking-[0.16em] text-accent">Revisão ativa</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Revisão</h1>
          <p className="mt-4 max-w-xl text-xl leading-8 text-muted">{review.roteiro.aviso}</p>
        </section>

        <section className="mt-8 rounded-[2rem] border border-border bg-surface p-7 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full bg-accent-soft px-5 py-3 font-semibold text-accent">{review.materia}</span>
            <span className="text-base font-semibold text-muted">Revisão ativa</span>
          </div>
          <h2 className="mt-7 font-display text-3xl font-semibold leading-tight sm:text-4xl">{review.materia} - {review.assunto}</h2>
          <p className="mt-5 text-xl leading-8 text-muted">{review.roteiro.prompts.length} perguntas para testar a fixação do conteúdo antes de abrir o material.</p>
        </section>

        <aside className="mt-8 rounded-[2rem] border border-border bg-surface-muted p-7 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-white"><Lightbulb aria-hidden="true" size={31} /></span>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Lembre-se antes de abrir</h2>
          </div>
          <p className="mt-5 text-xl leading-8 text-muted">Tente lembrar dos estudos é o que faz você aprender, errar faz parte do aprendizado.</p>
        </aside>

        <section className="mt-8 space-y-5" aria-label="Perguntas de revisão">
          {review.roteiro.prompts.map((prompt, index) => {
            const isRemembered = remembered.includes(index);
            return (
              <article key={`${prompt}-${index}`} className={`rounded-[2rem] border p-7 transition sm:p-8 ${isRemembered ? "border-accent bg-accent-soft" : "border-border bg-surface"}`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xl font-semibold text-muted">Pergunta {index + 1}</p>
                  <button type="button" onClick={() => toggleRemembered(index)} className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-base font-semibold transition ${isRemembered ? "bg-accent text-white" : "bg-surface-muted text-muted hover:text-accent"}`}>
                    {isRemembered ? <Check aria-hidden="true" size={18} /> : null}{isRemembered ? "Lembrei" : "Lembre-se"}
                  </button>
                </div>
                <h3 className="mt-7 font-display text-2xl font-semibold leading-snug sm:text-3xl">{prompt}</h3>
              </article>
            );
          })}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-page/95 px-5 pb-5 pt-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl gap-3">
          <Link href="/dashboard" className="hidden min-h-16 items-center justify-center rounded-full border border-border bg-surface px-6 text-lg font-semibold text-foreground sm:inline-flex">Voltar</Link>
          <Link href="/dashboard" className="inline-flex min-h-16 flex-1 items-center justify-center rounded-full bg-accent px-5 text-xl font-semibold text-white transition hover:brightness-95">Conferir respostas</Link>
        </div>
      </div>
    </main>
  );
}

function ReviewState({ title, message }: { title: string; message: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-page px-5 text-foreground"><div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-7 text-center"><h1 className="font-display text-2xl font-semibold">{title}</h1><p className="mt-3 leading-7 text-muted">{message}</p><Link href="/dashboard" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 font-semibold text-white">Voltar para Home</Link></div></main>;
}

export default function ReviewPage() {
  return <Suspense fallback={<ReviewState title="Preparando revisão" message="Aguardando os dados do backend." />}><ReviewPageContent /></Suspense>;
}