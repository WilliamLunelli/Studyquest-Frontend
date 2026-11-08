"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pause, Play, Square } from "lucide-react";
import { fetchCurrentCycle } from "@/lib/services/cycle-client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createSession, finishSession, getActiveSession, pauseSession, resumeSession, type ActiveSession, type FinishedSession, type SelfAssessment, type SessionPreset, type SessionType } from "@/lib/services/sessions-client";
import { elapsedSessionSeconds, presetForBlockDuration, validateQuestionCounts } from "@/lib/frontend/session";
import { createQuestionLog, type QuestionLogInput } from "@/lib/services/performance-client";
import { readUserStorage, writeUserStorage } from "@/lib/user-storage";
import { fetchNextReview } from "@/lib/services/reviews-client";

const presets = [{ value: "P25_5", label: "25 / 5", duration: 25 }, { value: "P50_10", label: "50 / 10", duration: 50 }, { value: "LIVRE", label: "Livre" }] as const;
const assessments = [{ value: "travei", label: "Travei" }, { value: "ok", label: "Ok" }, { value: "tranquilo", label: "Tranquilo" }] as const;
const typeLabel = (type: SessionType) => type === "QUESTOES" ? "Questões" : type === "REVISAO" ? "Revisão" : "Teoria";
type Completion = { result: FinishedSession; subjectName: string; topicName: string; questionXp: number; displaySeconds?: number; pending?: QuestionLogInput; questionsSaved?: boolean; reviewDateUnconfirmed?: boolean };

function SessionPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const blockId = params.get("blockId") ?? "";
  const reviewId = params.get("reviewId") ?? "";
  const subjectName = params.get("subject") ?? "Sessão de estudo";
  const topicName = params.get("topic") ?? "Assunto selecionado";
  const [subjectId, setSubjectId] = useState(params.get("subjectId") ?? "");
  const [topicId, setTopicId] = useState(params.get("topicId") ?? "");
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>(params.get("sessionType") === "REVISAO" || reviewId ? "REVISAO" : params.get("sessionType") === "QUESTOES" ? "QUESTOES" : "TEORIA");
  const [preset, setPreset] = useState<SessionPreset>("P50_10");
  const [plannedDurationMin, setPlannedDurationMin] = useState<number | undefined>();
  const presetChosen = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedActive, setCheckedActive] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());
  const [assessment, setAssessment] = useState<SelfAssessment | null>(null);
  const [note, setNote] = useState("");
  const [finished, setFinished] = useState<Completion | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [questionsDone, setQuestionsDone] = useState("");
  const [questionsCorrect, setQuestionsCorrect] = useState("");
  const assessmentRef = useRef<HTMLDivElement>(null);
  const actionInFlight = useRef(false);
  const syncing = useRef(false);
  const syncRevision = useRef(0);
  const sessionRef = useRef(session);
  const mounted = useRef(false);
  sessionRef.current = session;

  function beginAction() {
    if (actionInFlight.current) return false;
    actionInFlight.current = true;
    syncRevision.current++;
    setIsBusy(true);
    return true;
  }
  function endAction() { actionInFlight.current = false; setIsBusy(false); }

  function fail(result: { status: string; message: string }) {
    if (result.status === "unauthorized") router.replace("/login");
    else setMessage(result.message);
  }

  const checkActive = useCallback(async (quiet = false): Promise<void> => {
    if (actionInFlight.current || syncing.current) return;
    syncing.current = true;
    const revision = ++syncRevision.current;
    if (!quiet) setIsLoading(true);
    const result = await getActiveSession();
    syncing.current = false;
    if (!mounted.current) return;
    if (revision !== syncRevision.current) {
      if (!actionInFlight.current) void checkActive(true);
      return;
    }
    if (result.status === "unauthorized") { router.replace("/login"); return; }
    if (result.status === "ok") {
      const previousId = sessionRef.current?.id;
      setCheckedActive(true);
      setSession(result.data);
      setNow(Date.now());
      if (!quiet || (result.data && result.data.id !== previousId)) setShowRecovery(Boolean(result.data));
      if (!result.data) {
        setShowRecovery(false);
        setAssessment(null);
        if (previousId) setMessage("Esta sessão foi encerrada em outra aba ou aparelho. Confira seu progresso na Home.");
        const pending = readUserStorage<Completion>("pending_questions");
        if (pending?.pending && pending.result?.sessao?.id) setFinished(pending);
      }
    } else { setCheckedActive(false); setMessage(result.message); }
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    mounted.current = true;
    void checkActive();
    const refresh = () => {
      if (document.visibilityState === "visible" && sessionRef.current) void checkActive(true);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      mounted.current = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [checkActive]);
  useEffect(() => {
    if (session || !blockId || (subjectId && topicId)) return;
    let cancelled = false;
    void fetchCurrentCycle().then((result) => {
      if (cancelled) return;
      if (result.status === "unauthorized") { router.replace("/login"); return; }
      if (result.status !== "ok") { setMessage(result.message); return; }
      const block = result.data.blocos.find((b) => b.id === blockId);
      if (!block?.topicId) { setMessage("Este bloco não tem um assunto disponível. Escolha outro bloco no ciclo."); return; }
      setSubjectId(block.subjectId); setTopicId(block.topicId);
      setPlannedDurationMin(block.duracaoMin);
      if (!presetChosen.current) setPreset(presetForBlockDuration(block.duracaoMin));
    });
    return () => { cancelled = true; };
  }, [blockId, subjectId, topicId, session, router]);
  useEffect(() => {
    if (session?.status !== "RUNNING") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [session]);
  useEffect(() => { if (assessment) assessmentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [assessment]);

  const seconds = session ? elapsedSessionSeconds(session, now) : 0;
  const activeSubject = session?.subjectName ?? "Sessão recuperada";
  const activeTopic = session?.topicName ?? "Assunto não identificado";

  async function start() {
    if (!checkedActive || !subjectId || !topicId || !beginAction()) return;
    setMessage("");
    const selected = presets.find((p) => p.value === preset)!;
    const result = await createSession({ subjectId, topicId, tipo: sessionType, preset, ...(blockId ? { blocoId: blockId } : {}), ...(reviewId ? { reviewId } : {}), ...("duration" in selected ? { duracaoAlvoMin: selected.duration } : {}) }, { subjectName, topicName, plannedDurationMin });
    if (result.status === "ok") { setSession(result.data); setNow(Date.now()); }
    else fail(result);
    endAction();
    if (result.status === "conflict" || result.status === "offline") void checkActive(true);
  }

  async function transition(action: "pause" | "resume") {
    if (!session || !beginAction()) return false;
    setMessage("");
    const result = await (action === "pause" ? pauseSession(session.id, session) : resumeSession(session.id, session));
    if (result.status === "ok") { setSession(result.data); setNow(Date.now()); }
    else fail(result);
    endAction();
    if (result.status === "conflict" || result.status === "offline") void checkActive(true);
    return result.status === "ok";
  }

  async function leave() {
    if (!beginAction()) return;
    if (session?.status === "RUNNING") {
      const result = await pauseSession(session.id, session);
      if (result.status !== "ok") { fail(result); endAction(); void checkActive(true); return; }
    }
    endAction();
    router.push("/dashboard");
  }

  async function saveQuestions(completion: Completion) {
    if (!completion.pending) return;
    // Keep the finished result and form available if the separate write fails or this page reloads.
    writeUserStorage("pending_questions", completion);
    const result = await createQuestionLog(completion.pending);
    if (result.status === "ok") {
      // Question accuracy may move the review after finishSession has already returned its original date.
      const latest = await fetchNextReview(completion.pending.topicId);
      const updatedResult = latest.status === "ok" ? { ...completion.result, proximaRevisao: {
        reviewId: latest.data?.reviewId ?? null, agendadaPara: latest.data?.agendadaPara ?? null, intervaloDias: null,
      } } : completion.result;
      setFinished({ ...completion, result: updatedResult, pending: undefined, questionsSaved: true, questionXp: result.data?.xpGanho ?? 0, reviewDateUnconfirmed: latest.status !== "ok" });
      writeUserStorage("pending_questions", null);
      setMessage("");
    } else {
      setMessage(`Sessão registrada. As questões ainda não foram confirmadas: ${result.message}`);
    }
  }

  async function finish() {
    if (!session || !assessment || actionInFlight.current) return;
    const validation = session.type === "QUESTOES" ? validateQuestionCounts(questionsDone, questionsCorrect) : null;
    if (validation) { setMessage(validation); return; }
    if (session.type === "QUESTOES" && questionsDone && (!session.subjectId || !session.topicId)) { setMessage("Não foi possível identificar o assunto da sessão recuperada. Apague os campos de questões para encerrar somente a sessão."); return; }
    if (!beginAction()) return;
    setMessage("");
    if (session.type === "REVISAO") {
      const latest = await getActiveSession();
      if (latest.status !== "ok") { fail(latest); endAction(); return; }
      if (latest.data?.id !== session.id) {
        endAction(); await checkActive(true); setMessage("Esta sessão já mudou em outra aba ou aparelho. Confira seu progresso."); return;
      }
      setSession(latest.data); setNow(Date.now());
      if (latest.data.minutosAcumulados < 5) {
        setMessage(`O histórico contabilizou ${latest.data.minutosAcumulados} min. A revisão exige 5 minutos contabilizados; segundos parciais de cada pausa ainda são descartados pelo serviço.`);
        endAction(); return;
      }
    }
    const result = await finishSession(session.id, assessment, note);
    if (result.status === "ok") {
      const completion: Completion = { result: result.data, subjectName: activeSubject, topicName: activeTopic, questionXp: 0, displaySeconds: elapsedSessionSeconds(session),
        ...(session.type === "QUESTOES" && Number(questionsDone) > 0 ? { pending: { subjectId: session.subjectId, topicId: session.topicId, feitas: Number(questionsDone), acertadas: Number(questionsCorrect || 0), sessionId: session.id } } : {}) };
      setFinished(completion); setSession(null);
      if (completion.pending) await saveQuestions(completion);
    } else fail(result);
    endAction();
    if (result.status === "conflict" || result.status === "offline") void checkActive(true);
  }

  if (isLoading) return <Layout><p role="status">Verificando sua sessão...</p></Layout>;

  if (finished) {
    const result = finished.result;
    const short = result.sessao.minutosTotais < 5;
    return <Layout><header className="flex items-center justify-between gap-3"><Link href="/dashboard" className="font-display text-2xl font-semibold">StudyQuest</Link><ThemeToggle /></header>
      <h1 className="mt-8 font-display text-3xl font-semibold">Sessão registrada</h1><p className="mt-3 text-lg text-muted">{finished.subjectName} · {finished.topicName}</p>
      <section className="mt-6 rounded-3xl border border-border bg-surface p-6"><p className="text-muted">Tempo estudado</p><p className="mt-2 font-mono text-5xl font-semibold">{formatTimer(result.sessao.minutosTotais * 60)}</p>{(finished.displaySeconds ?? 0) > result.sessao.minutosTotais * 60 ? <p className="mt-3 text-sm leading-6 text-muted">O relógio desta tela marcou {formatTimer(finished.displaySeconds!)}. O histórico registrou {result.sessao.minutosTotais} min, pois os segundos parciais de cada trecho ainda não são contabilizados.</p> : null}<p className="mt-4 text-xl font-semibold">+{result.xp.ganho + finished.questionXp} XP</p><p className="mt-2 text-sm text-muted">{result.xp.ganho} XP da sessão{finished.questionsSaved ? ` + ${finished.questionXp} XP das questões` : ""}</p><p className="mt-4 text-sm leading-6 text-muted">{short ? "Sessões com menos de 5 minutos ficam no histórico, mas não concedem XP de estudo, não avançam o bloco nem agendam revisão." : "Tempo e avaliação registrados. Seu progresso foi atualizado pelo sistema."}</p></section>
      <section className="mt-6 rounded-3xl border border-border bg-surface p-6"><h2 className="font-semibold">Próxima revisão</h2><p className="mt-3 text-muted">{finished.reviewDateUnconfirmed ? "Questões salvas. Não foi possível atualizar a data da revisão agora; confira suas revisões na Home." : result.proximaRevisao.agendadaPara ? `${new Date(result.proximaRevisao.agendadaPara).toLocaleDateString("pt-BR")}${result.proximaRevisao.intervaloDias !== null ? ` · intervalo de ${result.proximaRevisao.intervaloDias} dias` : ""}` : "Nenhuma revisão pendente para este assunto."}</p><p className="mt-3 text-sm text-muted">Avaliação: {assessments.find((a) => a.value === assessment)?.label ?? "registrada"}</p></section>
      {message ? <p role="alert" className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{message}</p> : null}
      {finished.pending ? <section className="mt-5 rounded-3xl border border-border bg-surface p-5"><h2 className="font-semibold">Questões pendentes de confirmação</h2><p className="mt-2 text-sm text-muted">{finished.pending.acertadas} de {finished.pending.feitas} acertos. Se houve perda de conexão, confira o desempenho antes de repetir para evitar um registro duplicado.</p><Link href="/dashboard/analytics" className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent">Conferir desempenho</Link><button type="button" disabled={isBusy} onClick={async () => { if (!beginAction()) return; await saveQuestions(finished); endAction(); }} className="mt-3 min-h-12 w-full rounded-full bg-accent px-4 font-semibold text-white disabled:opacity-50">{isBusy ? "Salvando..." : "Tentar salvar questões novamente"}</button></section> : null}
      {result.proximoBloco.materia ? <section className="mt-6"><h2 className="font-semibold">Próximo bloco</h2><p className="mt-2 text-muted">{result.proximoBloco.materia} · {result.proximoBloco.assunto} · {result.proximoBloco.duracaoMin} min</p></section> : null}
      <Link href="/dashboard" className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-full border border-border px-5 font-semibold">Voltar à Home</Link>
    </Layout>;
  }

  if (session) {
    const target = session.duracaoAlvoMin ?? session.plannedDurationMin;
    const progress = target ? Math.min(100, Math.floor(seconds / (target * 60) * 100)) : 0;
    return <Layout><header className="flex items-center justify-between gap-3"><Link href="/dashboard" onClick={(e) => { e.preventDefault(); void leave(); }} className="font-semibold">Voltar à Home</Link><ThemeToggle /></header>
      <p className="mt-7 text-sm font-semibold uppercase tracking-widest text-accent">{session.status === "PAUSED" ? "Sessão pausada" : "Em andamento"}</p><h1 className="mt-3 font-display text-3xl font-semibold">{activeSubject}</h1><p className="mt-2 text-lg text-muted">{activeTopic}</p>
      {showRecovery ? <section role="dialog" aria-modal="true" aria-labelledby="recovery-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"><div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6"><h2 id="recovery-title" className="font-display text-2xl font-semibold">Sessão recuperada</h2><p className="mt-3 text-muted">{activeSubject} · {formatTimer(seconds)} acumulados nesta tela.</p>{message ? <p role="alert" className="mt-3 text-sm text-amber-700">{message}</p> : null}<button type="button" disabled={isBusy} onClick={async () => { if (session.status !== "PAUSED" || await transition("resume")) setShowRecovery(false); }} className="mt-5 min-h-12 w-full rounded-full bg-accent px-4 font-semibold text-white">Retomar sessão</button><button type="button" disabled={isBusy} onClick={() => { setShowRecovery(false); setAssessment("ok"); }} className="mt-3 min-h-12 w-full rounded-full border border-border px-4 font-semibold">Encerrar e avaliar</button></div></section> : null}
      <div className="mt-6 grid grid-cols-3 gap-2">{(["TEORIA", "QUESTOES", "REVISAO"] as SessionType[]).map((type) => <button key={type} type="button" disabled aria-pressed={session.type === type} className={`min-h-12 rounded-2xl border px-2 text-sm font-semibold ${session.type === type ? "border-accent bg-accent-soft text-accent" : "border-border text-muted opacity-60"}`}>{typeLabel(type)}</button>)}</div>
      <section className="mt-7 text-center"><p role="timer" aria-label="Tempo de estudo" className="font-mono text-6xl font-semibold tabular-nums">{formatTimer(seconds)}</p><p className="mt-4 text-muted">{session.preset === "LIVRE" ? target ? `Bloco planejado de ${target} min · pausas manuais` : "Tempo livre" : `Alvo de ${target} min · pausa sugerida de ${session.preset === "P25_5" ? 5 : 10} min`}</p>{target ? <><progress aria-label="Progresso da sessão" value={progress} max={100} className="mt-5 h-3 w-full accent-[#974fc9]" /><p className="mt-2 text-sm text-muted">{progress}% do alvo</p></> : null}</section>
      <p className="mt-4 rounded-2xl bg-surface-muted p-4 text-sm leading-6 text-muted">Última confirmação do histórico: {session.minutosAcumulados} min. O relógio desta tela mantém os segundos, mas o histórico ainda descarta a parte incompleta de cada minuto ao pausar.</p>
      <p className="mt-5 text-sm leading-6 text-muted">Tipo e preset são definidos ao iniciar. O XP é calculado ao encerrar, conforme seu tempo acumulado no dia. Sessões com menos de 5 minutos não concedem XP de estudo.</p>
      {!session.subjectId || !session.topicId ? <p className="mt-4 rounded-2xl bg-surface-muted p-4 text-sm text-muted">O assunto desta sessão não está disponível neste aparelho. Você pode retomar ou encerrar o estudo; o registro de questões exige os dados do aparelho onde ela começou.</p> : null}
      <div className="mt-6 flex gap-3"><button type="button" disabled={isBusy} onClick={() => void transition(session.status === "RUNNING" ? "pause" : "resume")} className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 font-semibold text-white disabled:opacity-50">{session.status === "RUNNING" ? <><Pause size={18} />Pausar</> : <><Play size={18} />Retomar</>}</button><button type="button" disabled={isBusy} onClick={() => setAssessment("ok")} className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 font-semibold"><Square size={18} />Encerrar sessão</button></div>
      {assessment ? <div ref={assessmentRef} className="mt-6 space-y-4 rounded-3xl border border-border bg-surface p-5"><h2 className="font-display text-2xl font-semibold">Como foi?</h2><div className="flex gap-2">{assessments.map((a) => <button key={a.value} type="button" disabled={isBusy} aria-pressed={assessment === a.value} onClick={() => setAssessment(a.value)} className={`min-h-12 flex-1 rounded-2xl border text-sm font-semibold ${assessment === a.value ? "border-accent bg-accent-soft text-accent" : "border-border"}`}>{a.label}</button>)}</div><p className="text-xs text-muted">A data da próxima revisão será confirmada ao salvar sua avaliação.</p><label className="block text-sm font-semibold">Nota opcional<textarea disabled={isBusy} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-border bg-surface-muted p-3" /></label>
        {session.type === "QUESTOES" && session.subjectId && session.topicId ? <div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Questões feitas<input disabled={isBusy} type="number" min={1} max={500} step={1} value={questionsDone} onChange={(e) => setQuestionsDone(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-surface-muted px-3" /></label><label className="text-sm font-semibold">Acertos<input disabled={isBusy} type="number" min={0} max={questionsDone || 500} step={1} value={questionsCorrect} onChange={(e) => setQuestionsCorrect(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-surface-muted px-3" /></label><p className="col-span-2 text-xs text-muted">Registro opcional. Deixe ambos em branco para salvar somente a sessão.</p></div> : null}
        <button type="button" disabled={isBusy} onClick={() => void finish()} className="min-h-12 w-full rounded-full bg-accent px-5 font-semibold text-white disabled:opacity-50">{isBusy ? "Salvando..." : "Confirmar encerramento"}</button><button type="button" disabled={isBusy} onClick={() => setAssessment(null)} className="min-h-11 w-full font-semibold text-muted">{session.status === "PAUSED" ? "Voltar ao cronômetro" : "Continuar estudando"}</button></div> : null}
      {message && !showRecovery ? <p role="alert" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{message}</p> : null}
    </Layout>;
  }

  return <Layout><header className="flex items-center justify-between"><Link href="/dashboard" className="font-semibold">Voltar à Home</Link><ThemeToggle /></header><h1 className="mt-8 font-display text-3xl font-semibold">Preparar sessão</h1><p className="mt-3 text-muted">{subjectName} · {topicName}</p>{plannedDurationMin ? <p className="mt-2 text-sm text-muted">Bloco planejado: {plannedDurationMin} min. Escolha outro preset abaixo se quiser ajustar o foco desta sessão.</p> : null}
    <div className="mt-6 grid grid-cols-3 gap-2">{(["TEORIA", "QUESTOES", "REVISAO"] as SessionType[]).map((type) => <button key={type} type="button" disabled={isBusy || Boolean(reviewId && type !== "REVISAO")} aria-pressed={sessionType === type} onClick={() => setSessionType(type)} className={`min-h-12 rounded-2xl border px-2 text-sm font-semibold disabled:opacity-50 ${sessionType === type ? "border-accent bg-accent-soft text-accent" : "border-border"}`}>{typeLabel(type)}</button>)}</div>
    <div className="mt-4 grid grid-cols-3 gap-2">{presets.map((p) => <button key={p.value} type="button" disabled={isBusy} aria-pressed={preset === p.value} onClick={() => { presetChosen.current = true; setPreset(p.value); }} className={`min-h-12 rounded-2xl border text-sm font-semibold ${preset === p.value ? "border-accent bg-accent-soft text-accent" : "border-border"}`}>{p.label}</button>)}</div>
    {message ? <p role="alert" className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{message}</p> : null}
    {!checkedActive ? <button type="button" onClick={() => void checkActive()} className="mt-5 min-h-12 w-full rounded-full border border-border font-semibold">Verificar sessão ativa novamente</button> : null}
    <button type="button" disabled={isBusy || !checkedActive || !subjectId || !topicId} onClick={() => void start()} className="mt-6 min-h-14 w-full rounded-full bg-accent px-5 font-semibold text-white disabled:opacity-50">{isBusy ? "Iniciando..." : "Começar sessão"}</button>
    {(!subjectId || !topicId) && !blockId ? <Link href="/cycle" className="mt-4 inline-flex min-h-12 w-full items-center justify-center font-semibold text-accent">Escolher um bloco no ciclo</Link> : null}
  </Layout>;
}

function Layout({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-page px-5 py-7 text-foreground"><div className="mx-auto w-full max-w-xl pb-10">{children}</div></main>; }
function formatTimer(seconds: number) { const safe = Math.max(0, Math.floor(seconds)); return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`; }
export default function SessionPage() { return <Suspense fallback={<Layout><p role="status">Preparando sessão...</p></Layout>}><SessionPageContent /></Suspense>; }
