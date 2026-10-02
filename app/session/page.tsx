"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Pause, Play, Square } from "lucide-react";
import { fetchCurrentCycle } from "@/lib/services/cycle-client";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  type ActiveSession,
  type CreateSessionInput,
  createSession,
  finishSession,
  getActiveSession,
  pauseSession,
  resumeSession,
  type SelfAssessment,
  type SessionPreset,
  type SessionType,
} from "@/lib/services/sessions-client";

const presets: Array<{ value: SessionPreset; label: string; duration?: 25 | 50 }> = [
  { value: "P25_5", label: "25 / 5", duration: 25 },
  { value: "P50_10", label: "50 / 10", duration: 50 },
  { value: "LIVRE", label: "Livre" },
];

const assessments: Array<{ value: SelfAssessment; label: string; interval: string }> = [
  { value: "travei", label: "Travei", interval: "1 dia" },
  { value: "ok", label: "Ok", interval: "3 dias" },
  { value: "tranquilo", label: "Tranquilo", interval: "7 dias" },
];

function SessionPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const blockId = searchParams.get("blockId") ?? "";
  const subjectId = searchParams.get("subjectId") ?? "";
  const topicId = searchParams.get("topicId") ?? "";
  const subjectName = searchParams.get("subject") ?? "Sessão de estudo";
  const topicName = searchParams.get("topic") ?? "Assunto selecionado";
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>("TEORIA");
  const [preset, setPreset] = useState<SessionPreset>("P50_10");
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [elapsedNow, setElapsedNow] = useState(Date.now());
  const [assessment, setAssessment] = useState<SelfAssessment | null>(null);
  const [note, setNote] = useState("");
  const [finished, setFinished] = useState<{ xp: number; minutes: number } | null>(null);
  const [resolvedSubjectId, setResolvedSubjectId] = useState(subjectId);
  const [resolvedTopicId, setResolvedTopicId] = useState(topicId);

  useEffect(() => {
    let cancelled = false;
    void getActiveSession().then((result) => {
      if (cancelled) return;
      if (result.status === "unauthorized") {
        router.push("/login");
      } else if (result.status === "ok") {
        setSession(result.data);
      } else {
        setMessage(result.message);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!blockId || (resolvedSubjectId && resolvedTopicId)) return;
    void fetchCurrentCycle().then((result) => {
      if (result.status !== "ok") return;
      const block = result.data.blocos.find((item) => item.id === blockId);
      if (!block) return;
      setResolvedSubjectId(block.subjectId);
      if (block.topicId) setResolvedTopicId(block.topicId);
    });
  }, [blockId, resolvedSubjectId, resolvedTopicId]);

  useEffect(() => {
    if (!session || session.status !== "RUNNING") return;
    const timer = window.setInterval(() => setElapsedNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  const displayedSeconds = useMemo(() => {
    if (!session) return 0;
    const accumulated = session.minutosAcumulados * 60;
    if (session.status !== "RUNNING" || !session.resumedAt) return accumulated;
    return accumulated + Math.max(0, Math.floor((elapsedNow - Date.parse(session.resumedAt)) / 1000));
  }, [elapsedNow, session]);

  const selectedPreset = presets.find((item) => item.value === preset) ?? presets[1];

  async function handleStart() {
    if (!blockId && (!resolvedSubjectId || !resolvedTopicId)) {
      setMessage("Escolha uma matéria e um assunto antes de iniciar a sessão.");
      return;
    }
    if (!resolvedSubjectId || !resolvedTopicId) {
      setMessage("Aguardando os dados da matéria e do assunto.");
      return;
    }

    setIsBusy(true);
    setMessage("");
    const input: CreateSessionInput = {
      ...(blockId ? { blocoId: blockId } : {}),
      subjectId: resolvedSubjectId,
      topicId: resolvedTopicId,
      tipo: sessionType,
      preset,
      ...(selectedPreset.duration ? { duracaoAlvoMin: selectedPreset.duration } : {}),
    };
    const result = await createSession(input);
    if (result.status === "ok") setSession({ ...result.data, resumedAt: result.data.startedAt });
    else setMessage(result.message);
    setIsBusy(false);
  }

  async function handleTransition(action: () => ReturnType<typeof pauseSession>) {
    if (!session) return;
    setIsBusy(true);
    setMessage("");
    const result = await action();
    if (result.status === "ok") {
      setSession({
        ...result.data,
        resumedAt: result.data.status === "RUNNING" ? new Date().toISOString() : null,
      });
    }
    else setMessage(result.message);
    setIsBusy(false);
  }

  async function handleFinish() {
    if (!session || !assessment) return;
    setIsBusy(true);
    setMessage("");
    const result = await finishSession(session.id, assessment, note);
    if (result.status === "ok") {
      setFinished({ xp: result.data.xp.ganho, minutes: result.data.sessao.minutosTotais });
      setSession(null);
    } else {
      setMessage(result.message);
    }
    setIsBusy(false);
  }

  if (isLoading) return <SessionState title="Carregando sessão" message="Verificando se existe uma sessão ativa." />;

  if (finished) {
    return (
      <SessionLayout>
        <section className="space-y-7 pb-8">
          <header className="flex items-center justify-between gap-4 border-b border-border pb-7">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent font-display text-3xl font-semibold text-white">S</span>
              <span className="font-display text-3xl font-semibold tracking-tight">StudyQuest</span>
            </div>
            <span className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent-soft px-4 text-lg font-semibold text-accent"><Check aria-hidden="true" size={20} />+{finished.xp} XP</span>
          </header>

          <div>
            <p className="text-xl text-muted">Sessão encerrada</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">{subjectName} - {topicName}</h1>
            <p className="mt-4 text-xl leading-8 text-muted">Você completou o bloco com foco e já ganhou recompensa.</p>
          </div>

          <article className="rounded-[2rem] border border-border bg-surface-muted p-7">
            <p className="text-xl text-muted">Tempo estudado</p>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
              <p className="font-mono text-6xl font-semibold tabular-nums tracking-tight">{formatTimer(finished.minutes * 60)}</p>
              <div className="text-right">
                <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-3 text-lg font-semibold text-[#f21b52]"><Check aria-hidden="true" size={21} />+{finished.xp} XP</p>
                <p className="mt-2 text-base text-muted">Recompensa liberada</p>
              </div>
            </div>
            <p className="mt-6 text-lg text-muted">Bloco concluído com sucesso.</p>
          </article>

          <section>
            <h2 className="font-display text-3xl font-semibold">Como foi?</h2>
            <div className="mt-5 space-y-4">
              {assessments.map((item) => (
                <article key={item.value} className={`flex items-center justify-between gap-4 rounded-3xl border p-6 ${assessment === item.value ? "border-accent bg-accent-soft" : "border-border bg-surface"}`}>
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{item.label === "Travei" ? "Travei" : item.label}</h3>
                    <p className="mt-2 text-base text-muted">{item.value === "travei" ? "Difícil, precisou de esforço" : item.value === "ok" ? "Médio, foi aproveitoso" : "Fácil, explicaria para alguém"}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-semibold ${item.value === "travei" ? "text-[#f21b52]" : "text-muted"}`}>{item.interval}</p>
                    <p className="mt-1 text-sm text-muted">Próxima revisão</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">Próximo bloco</h2>
            <div className="mt-4 space-y-3">
              <button type="button" onClick={() => router.push("/dashboard")} className="min-h-16 w-full rounded-full bg-accent px-5 py-3 text-xl font-semibold text-white">Continuar</button>
              <button type="button" onClick={() => router.push("/dashboard")} className="min-h-16 w-full rounded-full border border-border bg-surface px-5 py-3 text-xl font-semibold text-foreground">Responder depois</button>
            </div>
          </section>
        </section>
      </SessionLayout>
    );
  }

  if (session) {
    const targetSeconds = (session.duracaoAlvoMin ?? 50) * 60;
    const progress = Math.min(100, Math.round((displayedSeconds / targetSeconds) * 100));
    const estimatedXp = Math.max(0, Math.floor(displayedSeconds / 60));

    return (
      <SessionLayout>
        <section className="min-h-[calc(100dvh-3rem)] space-y-6 pb-44">
          <div className="flex items-start justify-between gap-4 border-b border-border pb-7">
            <div>
              <p className="text-xl text-muted">Em andamento</p>
              <h1 className="mt-3 font-display text-3xl font-semibold leading-tight">{subjectName} - {topicName}</h1>
            </div>
            <div className="flex items-center gap-2"><ThemeToggle /><button type="button" onClick={() => router.push("/dashboard")} className="min-h-12 shrink-0 rounded-2xl border border-border bg-surface px-5 text-base font-semibold text-muted transition hover:border-accent hover:text-accent">Sair</button></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(["TEORIA", "QUESTOES", "REVISAO"] as SessionType[]).map((type) => (
              <button key={type} type="button" onClick={() => setSessionType(type)} className={`min-h-16 rounded-3xl border px-2 text-base font-semibold ${sessionType === type ? "border-accent bg-accent text-white" : "border-border bg-surface text-foreground"}`}>
                {type === "QUESTOES" ? "Questões" : type === "REVISAO" ? "Revisão" : "Teoria"}
              </button>
            ))}
          </div>

          <div className="text-center">
            <p className="font-mono text-7xl font-semibold tabular-nums tracking-tight">{formatTimer(displayedSeconds)}</p>
            <p className="mt-5 text-xl text-muted">Restam de {session.duracaoAlvoMin ?? 50} min - pausa de 10 min depois</p>
            <div className="mt-8 h-3 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="mt-3 text-left text-base text-muted">{progress}% do bloco concluído</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {presets.map((item) => <button key={item.value} type="button" onClick={() => setPreset(item.value)} className={`min-h-16 rounded-3xl border px-2 text-base font-semibold ${session.preset === item.value ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-foreground"}`}>{item.label.replace("_", "/")}</button>)}
          </div>

          <article className="rounded-[2rem] border border-border bg-surface-muted p-7">
            <p className="text-base text-muted">XP nessa sessão</p>
            <p className="mt-4 font-display text-5xl font-semibold">+{estimatedXp} XP</p>
            <p className="mt-4 text-lg text-muted">1 XP por minuto focado</p>
          </article>

          <article className="rounded-[2rem] border border-border bg-surface p-6">
            <h2 className="font-semibold">Comportamento da sessão</h2>
            <p className="mt-3 text-base leading-7 text-muted">A tela escurece sozinha a cada 20 segundos. Sair da sessão pausa o cronômetro, mas não apaga o XP acumulado.</p>
          </article>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-page/95 px-5 pb-5 pt-4 backdrop-blur sm:px-6">
            <div className="mx-auto flex w-full max-w-xl gap-3">
              {session.status === "RUNNING" ? (
                <button type="button" disabled={isBusy} onClick={() => void handleTransition(() => pauseSession(session.id))} className="inline-flex min-h-16 flex-1 items-center justify-center gap-2 rounded-full bg-[#f21b52] px-4 py-3 text-xl font-semibold text-white disabled:opacity-50"><Pause aria-hidden="true" size={20} />Pausar</button>
              ) : (
                <button type="button" disabled={isBusy} onClick={() => void handleTransition(() => resumeSession(session.id))} className="inline-flex min-h-16 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-xl font-semibold text-white disabled:opacity-50"><Play aria-hidden="true" size={20} />Retomar</button>
              )}
              <button type="button" disabled={isBusy} onClick={() => setAssessment(assessment ?? "ok")} className="inline-flex min-h-16 flex-1 items-center justify-center gap-2 rounded-full bg-surface-muted px-4 py-3 text-xl font-semibold text-foreground disabled:opacity-50"><Square aria-hidden="true" size={20} />Encerrar sessão</button>
            </div>
          </div>
          {assessment ? (
            <div className="space-y-3 rounded-3xl border border-border bg-surface p-5">
              <h2 className="font-display text-2xl font-semibold">Como foi?</h2>
              <div className="grid gap-2">
                {assessments.map((item) => (
                  <button key={item.value} type="button" onClick={() => setAssessment(item.value)} className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 text-left ${assessment === item.value ? "border-accent bg-accent-soft" : "border-border"}`}>
                    <span className="font-semibold">{item.label}</span><span className="text-muted">{item.interval}</span>
                  </button>
                ))}
              </div>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nota opcional" rows={3} className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-foreground outline-none" />
              <button type="button" disabled={isBusy} onClick={() => void handleFinish()} className="min-h-12 w-full rounded-full bg-accent px-5 py-3 font-semibold text-white disabled:opacity-50">Confirmar encerramento</button>
            </div>
          ) : null}
          {message ? <p className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{message}</p> : null}
        </section>
      </SessionLayout>
    );
  }

  return (
    <SessionLayout>
      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Nova sessão</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">Foco no próximo bloco.</h1>
          <p className="mt-2 text-muted">O tempo e o XP serão calculados pelo servidor.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["TEORIA", "QUESTOES", "REVISAO"] as SessionType[]).map((type) => (
            <button key={type} type="button" onClick={() => setSessionType(type)} className={`min-h-12 rounded-2xl border px-2 text-sm font-semibold ${sessionType === type ? "border-accent bg-accent-soft text-accent" : "border-border text-muted"}`}>{type === "QUESTOES" ? "Questões" : type[0] + type.slice(1).toLowerCase()}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((item) => <button key={item.value} type="button" onClick={() => setPreset(item.value)} className={`min-h-12 rounded-2xl border px-2 text-sm font-semibold ${preset === item.value ? "border-accent bg-accent-soft text-accent" : "border-border text-muted"}`}>{item.label}</button>)}
        </div>
        {message ? <p className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{message}</p> : null}
        <button type="button" disabled={isBusy} onClick={() => void handleStart()} className="min-h-12 w-full rounded-full bg-accent px-5 py-3 font-semibold text-white disabled:opacity-50">{isBusy ? "Iniciando..." : "Começar sessão"}</button>
      </section>
    </SessionLayout>
  );
}

function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-page px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-xl">{children}</div>
    </main>
  );
}

function SessionState({ title, message }: { title: string; message: string }) {
  return <SessionLayout><div className="rounded-3xl bg-surface-muted p-6 text-center"><h1 className="font-display text-2xl font-semibold">{title}</h1><p className="mt-2 text-muted">{message}</p></div></SessionLayout>;
}

export default function SessionPage() {
  return <Suspense fallback={<SessionState title="Carregando sessão" message="Preparando o cronômetro." />}><SessionPageContent /></Suspense>;
}

function formatTimer(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  return [Math.floor(safeSeconds / 60), safeSeconds % 60]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}