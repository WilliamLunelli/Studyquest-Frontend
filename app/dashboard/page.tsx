"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Home as HomeIcon, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { type HomePayload, fetchHomeClient } from "@/lib/services/home-client";

function formatWeekday() {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(new Date());
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function sessionHref(blockId: string, subject: string, topic: string | null) {
  const params = new URLSearchParams({ blockId, subject });
  if (topic) params.set("topic", topic);
  return `/session?${params.toString()}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [home, setHome] = useState<HomePayload | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchHomeClient().then((result) => {
      if (result.status === "unauthorized") {
        router.push("/login");
        return;
      }

      if (result.status === "empty") {
        setIsEmpty(true);
      } else if (result.status === "error") {
        setErrorMessage(result.message);
      } else {
        setHome(result.data);
      }

      setIsLoading(false);
    });
  }, [router]);

  if (isLoading) {
    return <HomeState title="Carregando sua Home" message="Buscando seu próximo bloco de estudos." />;
  }

  const block = home?.proximoBloco;
  const hasContent = Boolean(block) && !isEmpty;

  return (
    <main className="min-h-screen bg-page pb-24 text-foreground">
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-7 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-display text-3xl font-semibold tracking-tight">StudyQuest</Link>
          <div className="flex items-center gap-3">
            <p className="text-base text-muted sm:text-lg">Sequência: <strong className="font-semibold text-foreground">{home?.streak.atual ?? 0} dias</strong></p>
            <ThemeToggle />
          </div>
        </header>
        <div className="mt-7 h-px bg-border" />

        {errorMessage ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p> : null}

        {hasContent && block ? home?.streak.atual === 0 ? <FirstDayHome home={home} /> : <FilledHome home={home} /> : <EmptyHome />}
      </div>
      <BottomNavigation />
    </main>
  );
}

function FilledHome({ home }: { home: HomePayload }) {
  const block = home.proximoBloco!;
  const reviewCount = home.revisoesHoje.length;
  const typeLabel = block.tipoSugerido === "revisao" ? "Revisão" : block.tipoSugerido === "questoes" ? "Questões" : "Teoria";

  return (
    <>
      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight">Hoje - {formatWeekday()}</h1>

      <section className="mt-6 rounded-[2rem] border border-border bg-surface-muted px-7 py-8">
        <p className="font-display text-6xl font-semibold leading-none tracking-tight">{block.duracaoMin} min</p>
        <p className="mt-5 text-xl text-muted">Bloco agendado para hoje</p>
      </section>

      <section className="mt-6 rounded-[2rem] border border-border bg-surface p-7">
        <p className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{block.materia}:</p>
        <h2 className="mt-1 font-display text-3xl font-semibold leading-tight sm:text-4xl">{block.assunto ?? "Próximo assunto"}</h2>
        <p className="mt-7 text-lg text-muted">
          {block.area ? `${block.area} · ` : "Ciclo de estudos · "}{block.peso ? `peso ${block.peso} ` : ""}{typeLabel}
        </p>
        <div className="mt-6 flex gap-3">
          <Link href={sessionHref(block.blocoId, block.materia, block.assunto) as never} className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-full bg-[#f21b52] px-5 text-xl font-semibold text-white transition hover:brightness-95">
            Começar <ArrowRight aria-hidden="true" size={25} />
          </Link>
          <button type="button" className="min-h-14 rounded-full border border-border bg-surface px-5 text-base font-semibold text-foreground transition hover:border-accent hover:text-accent">
            Trocar bloco
          </button>
        </div>
        <p className="mt-6 text-sm text-muted">Bloco {block.ordem ?? 1} do ciclo</p>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold">Revisões pendentes:</h2>
          <span className="font-display text-3xl font-semibold text-[#f21b52]">{reviewCount}</span>
        </div>
        <div className="mt-5 space-y-4">
          {home.revisoesHoje.length > 0 ? home.revisoesHoje.map((review) => (
            <Link key={review.reviewId} href={`/review?reviewId=${encodeURIComponent(review.reviewId)}`} className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-surface px-6 py-5 transition hover:border-accent">
              <div className="min-w-0">
                <h3 className="truncate font-display text-xl font-semibold">{review.materia} - {review.assunto}</h3>
                <p className="mt-1 text-base text-muted">{review.atrasada ? "Marcado como \"travado\" há 1 dia" : `Intervalo de ${review.multiplicadorXp === 2 ? "3" : "1"} dias`}</p>
              </div>
              <span className={`shrink-0 text-xl font-semibold ${review.atrasada ? "text-[#f21b52]" : "text-muted"}`}>{review.atrasada ? "Hoje" : "Amanhã"}</span>
            </Link>
          )) : <p className="rounded-3xl border border-border bg-surface px-6 py-5 text-muted">Nenhuma revisão pendente para hoje.</p>}
        </div>
      </section>
    </>
  );
}

function FirstDayHome({ home }: { home: HomePayload }) {
  const block = home.proximoBloco!;

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent">Primeiro dia</span>
        <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted">HOJE · DIA 1</span>
      </div>
      <section className="mt-6 rounded-[2rem] border border-border bg-surface-muted px-7 py-8">
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Seu ciclo está pronto.</h1>
        <p className="mt-3 text-xl text-muted">Comece pelo bloco mais pesado.</p>
      </section>
      <section className="mt-6 rounded-[2rem] border border-border bg-surface p-6">
        <Link href={sessionHref(block.blocoId, block.materia, block.assunto) as never} className="flex min-h-16 items-center justify-between gap-4 rounded-full bg-[#f21b52] px-6 text-lg font-semibold text-white transition hover:brightness-95 sm:text-xl">
          <span>Começar {block.duracaoMin} min de {block.materia}</span><ArrowRight aria-hidden="true" size={25} />
        </Link>
        <p className="mt-5 text-lg leading-7 text-muted">O primeiro bloco é {block.materia}, com {block.duracaoMin} min{block.peso ? ` e peso ${block.peso}` : ""}.</p>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Revisões pendentes</h2>
        <article className="mt-4 rounded-3xl border border-border bg-surface p-6">
          <h3 className="font-display text-xl font-semibold">Nada para revisar hoje</h3>
          <p className="mt-2 text-base leading-7 text-muted">A primeira revisão será agendada quando você responder “como foi” no fim da sessão.</p>
        </article>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Domínio de assuntos</h2>
        <article className="mt-4 rounded-3xl border border-border bg-surface p-6">
          <h3 className="font-display text-xl font-semibold">Nenhum assunto dominado ainda</h3>
          <p className="mt-2 text-base leading-7 text-muted">Seu domínio aparece aqui depois das primeiras sessões.</p>
        </article>
      </section>
    </>
  );
}

function EmptyHome() {
  return (
    <section className="mt-10 rounded-[2rem] border border-border bg-surface p-7 text-center sm:p-10">
      <CalendarDays aria-hidden="true" className="mx-auto text-accent" size={42} strokeWidth={1.6} />
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Seu ciclo começa aqui</p>
      <h1 className="mt-3 font-display text-3xl font-semibold leading-tight">Ainda não há blocos para hoje.</h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted">Quando seu ciclo de estudos estiver configurado, o próximo bloco, as revisões e sua sequência aparecerão nesta tela.</p>
    </section>
  );
}

function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex min-h-20 items-center justify-around border-t border-border bg-surface/95 px-5 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navegação principal">
      <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#f21b52]"><HomeIcon aria-hidden="true" size={23} /><span className="text-sm font-semibold">Home</span><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#f21b52]" /></Link>
      <Link href="/cycle" className="flex flex-col items-center gap-1 text-muted"><CalendarDays aria-hidden="true" size={23} /><span className="text-sm">Ciclo</span></Link>
      <Link href="/dashboard/analytics" className="flex flex-col items-center gap-1 text-muted"><UserCircle aria-hidden="true" size={23} /><span className="text-sm">Perfil</span></Link>
    </nav>
  );
}

function HomeState({ title, message }: { title: string; message: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-page px-5 text-foreground"><div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 text-center"><h1 className="font-display text-2xl font-semibold">{title}</h1><p className="mt-2 text-muted">{message}</p></div></main>;
}
