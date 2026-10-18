"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, LoaderCircle, Minus, Plus } from "lucide-react";
import { OnboardingError, OnboardingLoading, OnboardingShell } from "@/components/OnboardingShell";
import { fetchGoalWeights, fetchGoals, saveAvailability, saveDifficulties, saveOnboardingGoal, type AvailabilityDay, type Goal, type GoalWeight } from "@/lib/services/onboarding-client";
import { generateCycle, type CurrentCycle } from "@/lib/services/cycle-client";

type Draft = {
  step?: number;
  course?: string;
  goalId?: string;
  availability?: number[];
  levels?: Record<string, number>;
  cycle?: CurrentCycle;
};

const DRAFT_KEY = "studyquest_onboarding_draft";
const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const LEVELS = ["Bem insegura", "Insegura", "Mais ou menos", "Quase domino", "Domino"];

function courseName(goal: Goal) {
  return goal.nome.split(" · ")[0].trim();
}

export function OnboardingWizard() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [step, setStep] = useState(1);
  const [course, setCourse] = useState("");
  const [goalSearch, setGoalSearch] = useState("");
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [goalId, setGoalId] = useState("");
  const [weights, setWeights] = useState<GoalWeight[]>([]);
  const [availability, setAvailability] = useState<number[]>([0, 360, 360, 360, 360, 360, 0]);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [cycle, setCycle] = useState<CurrentCycle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);

  const courses = useMemo(() => [...new Set(goals.map(courseName))].filter((item) => item.toLocaleLowerCase("pt-BR").includes(goalSearch.toLocaleLowerCase("pt-BR"))), [goals, goalSearch]);
  const institutionOptions = useMemo(() => goals.filter((goal) => courseName(goal) === course && `${goal.instituicao ?? ""} ${goal.nome}`.toLocaleLowerCase("pt-BR").includes(institutionSearch.toLocaleLowerCase("pt-BR"))), [goals, course, institutionSearch]);
  const selectedGoal = goals.find((goal) => goal.id === goalId);
  const subjects = useMemo(() => weights.flatMap((weight) => weight.subjects.map((subject) => ({ ...subject, area: weight.area }))), [weights]);
  const weeklyMinutes = availability.reduce((total, minutes) => total + minutes, 0);

  useEffect(() => {
    let active = true;
    let savedDraft: Draft = {};
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        savedDraft = JSON.parse(saved) as Draft;
        if (savedDraft.step && savedDraft.step >= 1 && savedDraft.step <= 6) setStep(savedDraft.step);
        if (savedDraft.course) setCourse(savedDraft.course);
        if (savedDraft.goalId) setGoalId(savedDraft.goalId);
        if (savedDraft.availability?.length === 7) setAvailability(savedDraft.availability);
        if (savedDraft.levels) setLevels(savedDraft.levels);
        if (savedDraft.cycle) setCycle(savedDraft.cycle);
      }
      const requestedStep = Number(new URLSearchParams(window.location.search).get("step"));
      if (requestedStep >= 1 && requestedStep <= 6) {
        setStep(requestedStep > 1 && !savedDraft.goalId ? 1 : requestedStep);
      }
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    }
    void fetchGoals().then((result) => {
      if (!active) return;
      if (result.status === "ok") {
        setGoals(result.data);
        if (savedDraft.goalId) {
          void fetchGoalWeights(savedDraft.goalId).then((weightsResult) => {
            if (!active) return;
            if (weightsResult.status === "ok") setWeights(weightsResult.data);
            else setError(weightsResult.message);
            setIsLoading(false);
          });
        } else setIsLoading(false);
      } else {
        setError(result.message);
        setIsLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const draft: Draft = { step, course, goalId, availability, levels, cycle: cycle ?? undefined };
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* O fluxo continua sem rascunho local. */ }
  }, [step, course, goalId, availability, levels, cycle, isLoading]);

  async function continueToWeights() {
    if (!goalId) return setError("Escolha a instituição ou banca para continuar.");
    setIsSaving(true);
    setError("");
    const saved = await saveOnboardingGoal(goalId);
    if (saved.status !== "ok") {
      setError(saved.message);
      setIsSaving(false);
      return;
    }
    const result = await fetchGoalWeights(goalId);
    if (result.status !== "ok") {
      setError(result.message);
      setIsSaving(false);
      return;
    }
    setWeights(result.data);
    setExpandedAreas(result.data.length ? [result.data[0].areaId] : []);
    setStep(3);
    setIsSaving(false);
  }

  async function continueWithAvailability() {
    setIsSaving(true);
    setError("");
    const disponibilidade: AvailabilityDay[] = availability.map((minutos, diaSemana) => ({ diaSemana, minutos }));
    const result = await saveAvailability(disponibilidade);
    if (result.status === "ok") setStep(5);
    else setError(result.message);
    setIsSaving(false);
  }

  async function finishDifficulties() {
    if (!subjects.length) return setError("Não há matérias disponíveis para este objetivo.");
    setIsSaving(true);
    setError("");
    const saved = await saveDifficulties(subjects.map((subject) => ({ subjectId: subject.id, nivel: levels[subject.id] ?? 3 })));
    if (saved.status !== "ok") {
      setError(saved.message);
      setIsSaving(false);
      return;
    }
    const result = await generateCycle();
    if (result.status === "ok") {
      setCycle(result.data);
      setStep(6);
      setError("");
    } else {
      setError(result.message);
    }
    setIsSaving(false);
  }

  function goBack() {
    setError("");
    if (step === 1) router.push("/register");
    else if (step === 6) router.push("/dashboard");
    else setStep((current) => Math.max(1, current - 1));
  }

  if (isLoading) return <OnboardingLoading message="Carregando os objetivos disponíveis." />;

  const title = [
    "Qual é o seu objetivo?",
    "Onde você quer entrar?",
    "Nessa prova, não vale tudo igual.",
    "Quanto tempo você tem?",
    "Como você se sente em cada matéria?",
    "Seu ciclo está montado.",
  ][step - 1];
  const description = [
    "Escolha a prova ou curso que vai orientar seu ciclo de estudos.",
    "Selecione a universidade, órgão ou banca que será a base do seu ciclo.",
    "Os pesos vêm do catálogo do objetivo. Eles orientam a divisão do tempo entre as áreas e matérias.",
    "Distribua seus minutos disponíveis pela semana. Você pode deixar um dia de folga.",
    "Faça uma autoavaliação honesta. Ela ajuda a ordenar o ciclo e não altera sua nota.",
    "Seu ciclo foi gerado com os dados cadastrados. Você pode começar agora.",
  ][step - 1];

  return (
    <OnboardingShell step={step} title={title} description={description} onBack={goBack}>
      {step === 1 ? <>
        <label htmlFor="goal-search" className="mb-3 block text-xs font-bold uppercase tracking-[.14em] text-muted">Objetivo de estudo</label>
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4">
          <span className="text-muted" aria-hidden="true">⌕</span>
          <input id="goal-search" type="search" value={goalSearch} onChange={(event) => setGoalSearch(event.target.value)} placeholder="Buscar objetivo de estudo" className="h-12 min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted" />
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[.14em] text-muted">Mais procurados</p>
        <div className="grid gap-3 sm:grid-cols-2">{courses.map((item) => {
          const count = goals.filter((goal) => courseName(goal) === item).length;
          return <button key={item} type="button" onClick={() => { setCourse(item); setGoalId(""); }} className={`min-h-20 rounded-2xl border p-4 text-left transition ${course === item ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent"}`}>
            <span className="flex items-center justify-between font-display text-lg font-bold">{item}{course === item ? <Check size={18} className="text-accent" /> : null}</span>
            <span className="mt-1 block text-sm text-muted">{count > 1 ? `${count} instituições disponíveis` : goals.find((goal) => courseName(goal) === item)?.tipo}</span>
          </button>;
        })}</div>
        {courses.length === 0 && goals.length > 0 ? <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">Nenhum objetivo corresponde à busca.</p> : null}
        <p className="mt-4 text-sm text-muted">Você poderá trocar de objetivo depois. Seu histórico de estudos fica salvo.</p>
        <OnboardingError message={error} />
        <button type="button" disabled={!course} onClick={() => { setError(""); setStep(2); }} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-lg font-bold text-white disabled:opacity-40">Continuar <ArrowRight size={19} /></button>
      </> : null}

      {step === 2 ? <>
        <label htmlFor="institution-search" className="mb-3 block text-xs font-bold uppercase tracking-[.14em] text-muted">Instituição ou banca</label>
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4">
          <span className="text-muted" aria-hidden="true">⌕</span>
          <input id="institution-search" type="search" value={institutionSearch} onChange={(event) => setInstitutionSearch(event.target.value)} placeholder="Buscar instituição" className="h-12 min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted" />
        </div>
        <div className="space-y-3">{institutionOptions.map((goal) => <button key={goal.id} type="button" onClick={() => setGoalId(goal.id)} className={`flex min-h-20 w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${goalId === goal.id ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent"}`}>
          <span><span className="block font-display text-lg font-bold">{goal.instituicao ?? goal.nome}</span><span className="mt-1 block text-sm text-muted">{goal.nome} · {goal.tipo}</span></span>
          {goalId === goal.id ? <Check size={20} className="shrink-0 text-accent" /> : null}
        </button>)}</div>
        <OnboardingError message={error} />
        <button type="button" disabled={!goalId || isSaving} onClick={() => void continueToWeights()} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-lg font-bold text-white disabled:opacity-40">{isSaving ? <><LoaderCircle size={19} className="animate-spin" /> Salvando...</> : <>Continuar <ArrowRight size={19} /></>}</button>
      </> : null}

      {step === 3 ? <>
        <div className="mb-5 rounded-2xl border border-border bg-surface p-4"><span className="text-xs font-bold uppercase tracking-[.14em] text-muted">Pesos cadastrados</span><p className="mt-1 font-display text-lg font-bold">{selectedGoal?.nome ?? course}</p></div>
        <div className="space-y-3">{weights.map((weight) => {
          const expanded = expandedAreas.includes(weight.areaId);
          const toggle = () => setExpandedAreas((current) => expanded ? current.filter((id) => id !== weight.areaId) : [...current, weight.areaId]);
          return <section key={weight.areaId} className="overflow-hidden rounded-2xl border border-border bg-surface">
            <button type="button" onClick={toggle} aria-expanded={expanded} className="flex min-h-16 w-full items-center justify-between gap-4 p-4 text-left"><span className="font-semibold">{weight.area}<span className="ml-2 text-sm text-muted">peso {weight.peso}</span></span><ChevronDown size={18} className={`transition ${expanded ? "rotate-180" : ""}`} /></button>
            {expanded ? <div className="space-y-3 border-t border-border px-4 py-3">{weight.subjects.map((subject) => <div key={subject.id} className="text-sm">{subject.nome}</div>)}</div> : null}
          </section>;
        })}</div>
        <OnboardingError message={error} />
        <button type="button" disabled={!weights.length} onClick={() => { setError(""); setStep(4); }} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-lg font-bold text-white disabled:opacity-40">Continuar <ArrowRight size={19} /></button>
      </> : null}

      {step === 4 ? <>
        <div className="mb-4 flex gap-2">{[240, 360, 480].map((minutes) => <button key={minutes} type="button" onClick={() => setAvailability([0, minutes, minutes, minutes, minutes, minutes, 0])} className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-accent">{minutes / 60} h/dia</button>)}</div>
        <div className="space-y-2">{DAYS.map((day, index) => <div key={day} className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2">
          <span className="font-semibold">{day}</span><div className="flex items-center gap-3"><button type="button" aria-label={`Diminuir ${day}`} onClick={() => setAvailability((current) => current.map((value, position) => position === index ? Math.max(0, value - 30) : value))} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted hover:border-accent hover:text-accent"><Minus size={16} /></button><label className="sr-only" htmlFor={`minutes-${index}`}>{day} em minutos</label><input id={`minutes-${index}`} type="number" min={0} max={960} step={30} value={availability[index]} onChange={(event) => setAvailability((current) => current.map((value, position) => position === index ? Math.min(960, Math.max(0, Number(event.target.value) || 0)) : value))} className="w-16 bg-transparent text-center font-display text-lg font-bold outline-none" /><span className="text-xs text-muted">min</span><button type="button" aria-label={`Aumentar ${day}`} onClick={() => setAvailability((current) => current.map((value, position) => position === index ? Math.min(960, value + 30) : value))} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted hover:border-accent hover:text-accent"><Plus size={16} /></button></div>
        </div>)}</div>
        <p className="mt-4 rounded-2xl bg-surface-muted p-4 text-sm font-medium text-muted">{Math.floor(weeklyMinutes / 60)} h por semana · o ciclo será distribuído nos dias com tempo disponível.</p>
        <OnboardingError message={error} />
        <button type="button" disabled={isSaving || weeklyMinutes === 0} onClick={() => void continueWithAvailability()} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-lg font-bold text-white disabled:opacity-40">{isSaving ? "Salvando..." : <>Continuar <ArrowRight size={19} /></>}</button>
      </> : null}

      {step === 5 ? <>
        <p className="mb-4 rounded-2xl bg-surface-muted p-4 text-sm leading-6 text-muted">1 = bem insegura · 5 = domino e explicaria para alguém.</p>
        <div className="space-y-3">{subjects.map((subject) => <div key={subject.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-lg font-bold">{subject.nome}</h2><p className="text-sm text-muted">{subject.area}</p></div><span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-bold text-accent">{levels[subject.id] ?? 3}/5</span></div>
          <input aria-label={`Nível em ${subject.nome}`} type="range" min={1} max={5} step={1} value={levels[subject.id] ?? 3} onChange={(event) => setLevels((current) => ({ ...current, [subject.id]: Number(event.target.value) }))} className="mt-4 w-full accent-[#974fc9]" />
          <div className="flex justify-between gap-2 text-[11px] text-muted"><span>Bem insegura</span><span>{LEVELS[(levels[subject.id] ?? 3) - 1]}</span><span>Domino</span></div>
        </div>)}</div>
        <OnboardingError message={error} />
        <button type="button" disabled={isSaving || !subjects.length} onClick={() => void finishDifficulties()} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-lg font-bold text-white disabled:opacity-40">{isSaving ? <><LoaderCircle size={19} className="animate-spin" /> Montando seu ciclo...</> : <>Gerar meu ciclo <ArrowRight size={19} /></>}</button>
      </> : null}

      {step === 6 ? <>
        <div className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[.12em] text-accent"><Check size={15} /> Ciclo pronto</span>
          <p className="mt-4 text-sm text-muted">{cycle?.blocos.length ?? 0} blocos · {Math.floor(weeklyMinutes / 60)} h por semana · pesos por área de {selectedGoal?.nome ?? course}</p>
          {cycle?.blocos[0] ? <div className="mt-5 rounded-2xl bg-surface-muted p-5"><span className="text-xs font-bold uppercase tracking-[.14em] text-muted">Primeira tarefa</span><p className="mt-2 font-display text-3xl font-extrabold">{cycle.blocos[0].duracaoMin} min</p><p className="mt-1 text-lg font-bold">{cycle.blocos[0].materia} · {cycle.blocos[0].assunto ?? "Primeiro assunto"}</p></div> : null}
          <ol className="mt-5 space-y-3">{cycle?.blocos.slice(1, 6).map((block, index) => <li key={block.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 text-sm"><span><span className="mr-3 text-muted">{index + 2}</span>{block.materia} · {block.assunto ?? "Assunto"}</span><span className="shrink-0 text-muted">{block.duracaoMin} min</span></li>)}</ol>
          <p className="mt-5 text-sm text-muted">Você pode iniciar agora e ajustar seu ciclo mais tarde.</p>
        </div>
        <button type="button" onClick={() => { sessionStorage.removeItem(DRAFT_KEY); router.push("/dashboard"); }} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-lg font-bold text-white">Começar agora <ArrowRight size={19} /></button>
      </> : null}
    </OnboardingShell>
  );
}
