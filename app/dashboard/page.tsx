"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { type HomePayload, fetchHomeClient } from "@/lib/services/home-client";
import { BottomNavigation } from "@/components/BottomNavigation";

export default function DashboardPage() {
  const router = useRouter();
  const [home, setHome] = useState<HomePayload | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const loadHome = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    const result = await fetchHomeClient();
    if (result.status === "unauthorized") { router.replace("/login"); return; }
    if (result.status === "ok") setHome(result.data);
    else { setHome(null); setMessage(result.message); }
    setIsLoading(false);
  }, [router]);
  useEffect(() => { void loadHome(); }, [loadHome]);

  const block = home?.proximoBloco;
  const sessionParams = block ? new URLSearchParams({ blockId: block.blocoId, subject: block.materia, ...(block.assunto ? { topic: block.assunto } : {}) }) : null;

  return (
    <main className="min-h-screen bg-page pb-28 text-foreground">
      <div className="mx-auto w-full max-w-2xl px-5 py-7 sm:px-8">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-6">
          <Link href="/dashboard" className="font-display text-2xl font-semibold sm:text-3xl">StudyQuest</Link>
          <div className="flex items-center gap-3"><span className="text-sm text-muted">Sequência: <strong>{home?.streak.atual ?? 0} dias</strong></span><ThemeToggle /></div>
        </header>

        {isLoading ? <p role="status" className="mt-8 text-muted">Carregando sua rotina...</p> : home && block ? <>
          <h1 className="mt-8 font-display text-3xl font-semibold">Seu próximo passo</h1>
          <section aria-label="Seu progresso" className="mt-5 grid grid-cols-2 gap-4">
            <article className="rounded-3xl border border-border bg-surface p-5"><p className="text-sm text-muted">Nível {home.xp.nivel} · {home.xp.titulo}</p><p className="mt-2 font-display text-2xl font-semibold">{home.xp.total} XP</p><progress aria-label="Progresso do nível" value={home.xp.xpNoNivel} max={Math.max(1, home.xp.xpNoNivel + home.xp.xpParaProximoNivel)} className="mt-3 h-2 w-full accent-[#974fc9]" /><p className="mt-2 text-xs text-muted">Faltam {home.xp.xpParaProximoNivel} XP para o próximo nível</p></article>
            <article className="rounded-3xl border border-border bg-surface p-5"><p className="text-sm text-muted">Meta de hoje</p><p className="mt-2 font-display text-2xl font-semibold">{home.streak.minutosHoje} min</p><p className="mt-3 text-sm text-muted">{home.streak.metaDiariaMin > 0 ? `de ${home.streak.metaDiariaMin} min${home.streak.metaCumprida ? " · meta cumprida" : ""}` : "Dia sem meta definida"}</p><p className="mt-2 text-xs text-muted">{home.streak.escudosDisponiveis} escudos disponíveis</p></article>
          </section>
          <section className="mt-6 rounded-[2rem] border border-border bg-surface p-7">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Próximo bloco</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">{block.materia}</h2>
            <p className="mt-2 text-lg text-muted">{block.assunto ?? "Assunto a definir"} · {block.duracaoMin} min</p>
            <Link href={`/session?${sessionParams}`} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#f21b52] px-5 text-lg font-semibold text-white">Começar {block.duracaoMin} min de {block.materia}<ArrowRight size={21} /></Link>
            <Link href="/cycle" className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-border px-4 font-semibold">Trocar bloco</Link>
          </section>
          <section className="mt-8" aria-label="Revisões pendentes">
            <h2 className="font-display text-2xl font-semibold">Revisões pendentes · {home.revisoesHoje.length}</h2>
            <div className="mt-4 space-y-3">{home.revisoesHoje.length ? home.revisoesHoje.map((review) => <Link key={review.reviewId} href={`/review?reviewId=${encodeURIComponent(review.reviewId)}`} className="block rounded-3xl border border-border bg-surface p-5 hover:border-accent"><h3 className="font-semibold">{review.materia} · {review.assunto}</h3><p className="mt-2 text-sm text-muted">{review.atrasada ? "Atrasada" : "Hoje"} · {new Date(review.agendadaPara).toLocaleDateString("pt-BR")} · multiplicador {review.multiplicadorXp}x</p></Link>) : <p className="rounded-3xl border border-border bg-surface p-5 text-muted">Nenhuma revisão pendente para hoje. As próximas revisões serão agendadas ao concluir suas sessões.</p>}</div>
          </section>
          <Link href="/cycle" className="mt-6 block rounded-3xl border border-border bg-surface p-5 font-semibold">Ver ciclo e declarar domínio de assuntos <ArrowRight className="ml-2 inline" size={18} /></Link>
        </> : !isLoading ? <section className="mt-8 rounded-3xl border border-border bg-surface p-7">
          <h1 className="font-display text-2xl font-semibold">Vamos preparar sua rotina</h1>
          <p role="status" className="mt-4 text-muted">{message || "Configure seu objetivo e gere um ciclo para começar."}</p>
          <Link href="/settings" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-white"><Settings size={18} />Configurar ciclo</Link>
          <button type="button" onClick={() => void loadHome()} className="ml-3 mt-3 inline-flex min-h-12 items-center gap-2 px-3 font-semibold"><RefreshCw size={18} />Tentar novamente</button>
        </section> : null}
      </div>
      <BottomNavigation />
    </main>
  );
}
