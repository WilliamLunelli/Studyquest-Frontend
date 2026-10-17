"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Home, Pencil, RefreshCw, UserCircle, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fetchCurrentCycle, generateCycle, type CurrentCycle } from "@/lib/services/cycle-client";
import { BottomNavigation } from "@/components/BottomNavigation";

export default function CyclePage() {
  const router = useRouter();
  const [cycle, setCycle] = useState<CurrentCycle | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    void fetchCurrentCycle().then((result) => {
      if (result.status === "unauthorized") router.push("/login");
      else if (result.status === "ok") setCycle(result.data);
      else setMessage(result.message);
      setIsLoading(false);
    });
  }, [router]);

  async function handleRegenerateCycle() {
    setIsRegenerating(true);
    setMessage("");
    const result = await generateCycle();
    if (result.status === "ok") {
      setCycle(result.data);
      setMessage("Ciclo regenerado com sucesso!");
    } else {
      setMessage(result.message);
    }
    setIsRegenerating(false);
  }

  if (isLoading) return <CycleState title="Carregando ciclo" message="Buscando seus blocos de estudo." />;

  return (
    <main className="min-h-screen bg-page pb-28 text-foreground">
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-7 sm:px-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-accent">
              <ArrowLeft aria-hidden="true" size={17} /> Home
            </Link>
            <h1 className="font-display text-4xl font-semibold tracking-tight">Ciclo de estudos</h1>
            <p className="mt-5 text-lg text-muted">{cycle ? `${cycle.blocos.length} blocos no ciclo atual` : "Aguardando informações para montar seu ciclo"}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button type="button" disabled aria-label="Editar ciclo" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-muted opacity-60">
              <Pencil aria-hidden="true" size={25} />
            </button>
          </div>
        </header>

        <div className="mt-8 h-px bg-border" />

        {message ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</p> : null}

        {cycle ? <section className="mt-8 rounded-[2rem] border border-border bg-surface p-7 sm:p-8">
          <div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Ciclo atual</p><h2 className="mt-2 font-display text-3xl font-semibold">Bloco {cycle.posicaoAtual + 1} de {cycle.blocos.length}</h2></div><span className="rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent">{cycle.blocos.filter((block) => block.status === "concluido").length} concluídos</span></div>
          <div className="mt-7 space-y-3">{cycle.blocos.map((block) => <Link key={block.id} href={`/session?blockId=${encodeURIComponent(block.id)}&subject=${encodeURIComponent(block.materia)}${block.assunto ? `&topic=${encodeURIComponent(block.assunto)}` : ""}`} className={`flex items-center justify-between gap-4 rounded-3xl border p-5 transition hover:border-accent ${block.ordem === cycle.posicaoAtual + 1 ? "border-accent bg-accent-soft" : "border-border bg-surface"}`}><div><p className="text-sm font-semibold text-muted">Bloco {block.ordem}</p><h3 className="mt-1 font-display text-xl font-semibold">{block.materia}{block.assunto ? ` - ${block.assunto}` : ""}</h3></div><span className="shrink-0 text-base font-semibold text-muted">{block.duracaoMin} min</span></Link>)}</div>
        </section> : <section className="mt-8 rounded-[2rem] border border-border bg-surface p-7 text-center sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CalendarDays aria-hidden="true" size={38} strokeWidth={1.7} />
          </div>
          <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Ciclo incompleto</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight">Precisamos de mais informações</h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted">Quando seu objetivo, disponibilidade e dificuldades forem definidos, os blocos do ciclo aparecerão aqui.</p>
          <Link href="/settings" className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-lg font-semibold text-white sm:w-auto sm:min-w-64">
            <Settings aria-hidden="true" size={20} /> Configurar ciclo
          </Link>
        </section>}

        {!cycle ? <section className="mt-8 space-y-4" aria-label="Blocos aguardando dados">
          {["Próximo bloco", "Blocos seguintes", "Revisões"].map((label) => (
            <article key={label} className="rounded-3xl border border-border bg-surface px-6 py-5 opacity-60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-semibold">{label}</h3>
                  <p className="mt-2 text-base text-muted">Aguardando configuração do ciclo</p>
                </div>
                <span className="rounded-full bg-surface-muted px-3 py-2 text-sm font-semibold text-muted">--</span>
              </div>
            </article>
          ))}
        </section> : null}

        {!cycle ? <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/onboarding/goal" className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-full border border-border bg-surface px-5 text-lg font-semibold text-muted hover:border-accent hover:text-accent transition">
            <span className="text-2xl">+</span> Adicionar bloco
          </Link>
          <Link href="/onboarding/goal" className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-full border border-border bg-surface px-5 text-lg font-semibold text-muted hover:border-accent hover:text-accent transition">
            <RefreshCw aria-hidden="true" size={21} /> Refazer ciclo
          </Link>
        </div> : <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/settings" className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-full border border-border bg-surface px-5 text-lg font-semibold text-muted hover:border-accent hover:text-accent transition">
            <span className="text-2xl">+</span> Ajustar blocos
          </Link>
          <button
            type="button"
            onClick={handleRegenerateCycle}
            disabled={isRegenerating}
            className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-full border border-border bg-surface px-5 text-lg font-semibold text-muted hover:border-accent hover:text-accent transition disabled:opacity-50"
          >
            <RefreshCw aria-hidden="true" size={21} /> {isRegenerating ? "Regenerando..." : "Regenerar ciclo"}
          </button>
        </div>}
      </div>
      <BottomNavigation />
    </main>
  );
}

function CycleState({ title, message }: { title: string; message: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-page px-5 text-foreground"><div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-7 text-center"><h1 className="font-display text-2xl font-semibold">{title}</h1><p className="mt-3 text-muted">{message}</p></div></main>;
}


