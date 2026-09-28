"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pause, Play, Square } from "lucide-react";
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

function formatSeconds(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function SessionPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
    if (!subjectId || !topicId) {
      setMessage("Escolha uma matéria e um assunto antes de iniciar a sessão.");
      return;
    }

    setIsBusy(true);
    setMessage("");
    const input: CreateSessionInput = {
      subjectId,
      topicId,
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
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Sessão encerrada</p>
          <h1 className="font-display text-4xl font-semibold">Bom trabalho.</h1>
          <div className="rounded-3xl bg-surface-muted p-6">
            <p className="text-muted">Tempo confirmado pelo servidor</p>
            <p className="mt-2 font-display text-5xl font-semibold">{finished.minutes} min</p>
            <p className="mt-4 text-lg font-semibold text-accent">+{finished.xp} XP</p>
          </div>
          <button type="button" onClick={() => router.push("/dashboard")} className="min-h-12 w-full rounded-full bg-accent px-5 py-3 font-semibold text-white">
            Voltar ao início
          </button>
        </section>
      </SessionLayout>
    );
  }

  if (session) {
    return (
      <SessionLayout>
        <section className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Em andamento</p>
            <h1 className="mt-2 font-display text-3xl font-semibold">{subjectName}</h1>
            <p className="mt-1 text-muted">{topicName}</p>
          </div>
          <div className="rounded-3xl bg-surface-muted p-6 text-center">
            <p className="text-sm text-muted">Tempo exibido localmente; o servidor confirma ao encerrar.</p>
            <p className="mt-3 font-mono text-5xl font-semibold tabular-nums">{formatSeconds(displayedSeconds)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {session.status === "RUNNING" ? (
              <button type="button" disabled={isBusy} onClick={() => void handleTransition(() => pauseSession(session.id))} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border px-4 py-3 font-semibold text-foreground disabled:opacity-50"><Pause aria-hidden="true" size={17} />Pausar</button>
            ) : (
              <button type="button" disabled={isBusy} onClick={() => void handleTransition(() => resumeSession(session.id))} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 font-semibold text-white disabled:opacity-50"><Play aria-hidden="true" size={17} />Retomar</button>
            )}
            <button type="button" disabled={isBusy} onClick={() => setAssessment(assessment ?? "ok")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 font-semibold text-white disabled:opacity-50"><Square aria-hidden="true" size={17} />Encerrar</button>
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