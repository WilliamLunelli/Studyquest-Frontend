"use client";

import Link from "next/link";
import { ArrowLeft, LogOut, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomNavigation } from "@/components/BottomNavigation";
import { clearAuth } from "@/lib/jwt-auth";
import { DIFFICULTY_LABELS, fetchGoals, fetchProfile, fetchGoalWeights, readSavedAvailability, readSavedDifficulties, saveOnboardingGoal, saveAvailability, saveDifficulties, type Goal, type GoalWeight, type Profile } from "@/lib/services/onboarding-client";
import { generateCycle } from "@/lib/services/cycle-client";

const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const steps = [{ id: "goal", label: "Objetivo" }, { id: "availability", label: "Horários" }, { id: "difficulties", label: "Dificuldades" }] as const;
type Step = typeof steps[number]["id"];

export default function SettingsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("goal");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoalId, setActiveGoalId] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [minutes, setMinutes] = useState<string[]>(Array(7).fill(""));
  const [hasLocalAvailability, setHasLocalAvailability] = useState(false);
  const [weights, setWeights] = useState<GoalWeight[]>([]);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [needsCycle, setNeedsCycle] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = readSavedAvailability();
    if (cached) {
      setMinutes(weekdays.map((_, index) => String(cached.find((d) => d.diaSemana === index)?.minutos ?? 0)));
      setHasLocalAvailability(true);
    }
    void Promise.all([fetchProfile(), fetchGoals()]).then(async ([me, catalog]) => {
      if (cancelled) return;
      if (me.status === "unauthorized" || catalog.status === "unauthorized") { router.replace("/login"); return; }
      if (catalog.status === "ok") setGoals(catalog.data); else setError(catalog.message);
      if (me.status === "ok") {
        setProfile(me.data);
        const id = me.data.objetivo?.id ?? "";
        setActiveGoalId(id);
        setSelectedGoal(id);
        if (id) {
          const result = await fetchGoalWeights(id);
          if (cancelled) return;
          if (result.status === "ok") {
            setWeights(result.data);
            setLevels(Object.fromEntries(readSavedDifficulties().map((item) => [item.subjectId, item.nivel])));
          } else setError(result.message);
        }
      } else setError(me.message);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [router]);

  function handleFailure(result: { status: string; message: string }) {
    if (result.status === "unauthorized") router.replace("/login");
    else setError(result.message);
  }

  async function saveGoal() {
    if (!selectedGoal || selectedGoal === activeGoalId) return;
    setIsSaving(true); setError(""); setMessage("");
    const result = await saveOnboardingGoal(selectedGoal);
    if (result.status === "ok") {
      setActiveGoalId(selectedGoal);
      setNeedsCycle(true);
      setWeights([]);
      setLevels({});
      const next = await fetchGoalWeights(selectedGoal);
      if (next.status === "ok") setWeights(next.data); else handleFailure(next);
      setMessage("Objetivo alterado. Confira horários e dificuldades e gere seu novo ciclo.");
    } else handleFailure(result);
    setIsSaving(false);
  }

  async function savePreferences() {
    setError(""); setMessage("");
    if (step === "availability") {
      if (minutes.some((v) => v.trim() === "" || !Number.isInteger(Number(v)) || Number(v) < 0 || Number(v) > 960) || minutes.reduce((n, v) => n + Number(v), 0) === 0) {
        setError("Preencha os sete dias com minutos inteiros de 0 a 960 e reserve tempo em pelo menos um dia."); return;
      }
      setIsSaving(true);
      const result = await saveAvailability(minutes.map((v, diaSemana) => ({ diaSemana, minutos: Number(v) })));
      if (result.status === "ok") { setHasLocalAvailability(true); setNeedsCycle(true); setMessage("Horários salvos. Atualize o ciclo para aplicar a nova disponibilidade."); }
      else handleFailure(result);
    } else {
      const subjects = weights.flatMap((w) => w.subjects);
      if (!subjects.length || subjects.some((s) => !levels[s.id])) { setError("Avalie todas as matérias antes de salvar."); return; }
      setIsSaving(true);
      const result = await saveDifficulties(subjects.map((s) => ({ subjectId: s.id, nivel: levels[s.id] })));
      if (result.status === "ok") { setNeedsCycle(true); setMessage("Dificuldades salvas. Atualize o ciclo para aplicar a nova distribuição."); }
      else handleFailure(result);
    }
    setIsSaving(false);
  }

  async function regenerate() {
    setIsSaving(true); setError(""); setMessage("");
    const result = await generateCycle();
    if (result.status === "ok") { setNeedsCycle(false); setMessage("Ciclo atualizado com suas configurações salvas."); }
    else handleFailure(result);
    setIsSaving(false);
  }

  return <main className="min-h-screen bg-page pb-28 text-foreground"><div className="mx-auto w-full max-w-2xl px-5 py-7 sm:px-8">
    <header className="flex items-center justify-between gap-3 border-b border-border pb-6"><Link href="/dashboard" className="inline-flex items-center gap-2 font-semibold"><ArrowLeft size={18} />Home</Link><ThemeToggle /></header>
    <h1 className="mt-8 font-display text-3xl font-semibold">Configurações</h1>
    {profile ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-surface p-5"><div><p className="font-semibold">{profile.nome}</p><p className="text-sm text-muted">{profile.email}</p></div><button type="button" onClick={() => { clearAuth(); router.replace("/login"); router.refresh(); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 font-semibold"><LogOut size={17} />Sair da conta</button></div> : null}
    {isLoading ? <p role="status" className="mt-6 text-muted">Carregando suas configurações...</p> : <>
      <div role="tablist" aria-label="Preferências de estudo" className="mt-7 grid grid-cols-3 gap-2">{steps.map((item) => <button key={item.id} id={`tab-${item.id}`} type="button" role="tab" aria-selected={step === item.id} aria-controls={`panel-${item.id}`} disabled={isSaving || (item.id === "difficulties" && !activeGoalId)} onClick={() => { setStep(item.id); setMessage(""); setError(""); }} className={`min-h-12 rounded-2xl border px-2 text-sm font-semibold disabled:opacity-50 ${step === item.id ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface"}`}>{item.label}</button>)}</div>
      {message ? <p role="status" className="mt-5 rounded-2xl bg-accent-soft p-4 text-sm">{message}</p> : null}
      {error ? <p role="alert" className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      <section role="tabpanel" id={`panel-${step}`} aria-labelledby={`tab-${step}`} className="mt-6 space-y-4">
        {step === "goal" ? <><h2 className="font-display text-xl font-semibold">Seu objetivo</h2><p className="text-sm leading-6 text-muted">Trocar de objetivo desativa o ciclo atual. Para editar somente horários ou dificuldades, use as abas acima.</p>{goals.map((goal) => <button key={goal.id} type="button" aria-pressed={selectedGoal === goal.id} disabled={isSaving} onClick={() => setSelectedGoal(goal.id)} className={`block w-full rounded-3xl border p-5 text-left ${selectedGoal === goal.id ? "border-accent bg-accent-soft" : "border-border bg-surface"}`}><span className="font-semibold">{goal.nome}</span><span className="mt-1 block text-sm text-muted">{goal.instituicao ?? goal.tipo}{goal.id === activeGoalId ? " · objetivo atual" : ""}</span></button>)}<button type="button" disabled={isSaving || !selectedGoal || selectedGoal === activeGoalId} onClick={() => void saveGoal()} className="min-h-12 w-full rounded-full bg-accent px-5 font-semibold text-white disabled:opacity-50">{isSaving ? "Salvando..." : "Alterar objetivo"}</button></> : null}
        {step === "availability" ? <><h2 className="font-display text-xl font-semibold">Disponibilidade por dia</h2><p className="text-sm leading-6 text-muted">{hasLocalAvailability ? "Últimos horários salvos neste navegador. Se você alterou em outro aparelho, confira os valores antes de salvar." : "Seus horários anteriores não estão disponíveis neste navegador. Preencha uma nova disponibilidade para salvar."}</p>{weekdays.map((day, index) => <label key={day} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4"><span>{day}</span><span className="flex items-center gap-2"><input type="number" min={0} max={960} step={1} value={minutes[index]} placeholder="Minutos" onChange={(e) => setMinutes((values) => values.map((v, i) => i === index ? e.target.value : v))} className="h-12 w-24 rounded-xl border border-border bg-surface-muted px-2 text-center" /><span className="text-sm text-muted">min</span></span></label>)}</> : null}
        {step === "difficulties" ? <><h2 className="font-display text-xl font-semibold">Dificuldade por matéria</h2><p className="text-sm leading-6 text-muted">1 = domino · 5 = tenho muita dificuldade. Valores salvos em outro aparelho precisam ser informados novamente.</p><button type="button" onClick={() => setLevels(Object.fromEntries(weights.flatMap((w) => w.subjects.map((s) => [s.id, 3]))))} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold">Usar dificuldade média para todas</button>{weights.flatMap((w) => w.subjects.map((subject) => <label key={subject.id} className="block rounded-3xl border border-border bg-surface p-5"><span className="font-semibold">{subject.nome}</span><span className="mt-1 block text-sm text-muted">{w.area}</span><select aria-label={`Dificuldade em ${subject.nome}`} value={levels[subject.id] ?? ""} onChange={(e) => setLevels((values) => ({ ...values, [subject.id]: Number(e.target.value) }))} className="mt-3 min-h-12 w-full rounded-xl border border-border bg-surface-muted px-3"><option value="" disabled>Escolha a dificuldade</option>{DIFFICULTY_LABELS.map((label, index) => <option key={label} value={index + 1}>{index + 1} · {label}</option>)}</select></label>))}{!weights.length ? <p className="text-muted">Não foi possível carregar as matérias. Volte à Home e abra Configurações novamente.</p> : null}</> : null}
        {step !== "goal" ? <button type="button" disabled={isSaving} onClick={() => void savePreferences()} className="min-h-12 w-full rounded-full bg-accent px-5 font-semibold text-white disabled:opacity-50">{isSaving ? "Salvando..." : step === "availability" ? "Salvar horários" : "Salvar dificuldades"}</button> : null}
      </section>
      <section className="mt-8 rounded-3xl border border-border bg-surface p-5"><h2 className="font-semibold">Ciclo de estudos</h2><p className="mt-2 text-sm leading-6 text-muted">{needsCycle ? "Há configurações salvas para aplicar." : "Gerar um ciclo substitui a sequência atual de blocos. Seu histórico de estudos é preservado."}</p><button type="button" disabled={isSaving || !activeGoalId} onClick={() => void regenerate()} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-4 font-semibold disabled:opacity-50"><RefreshCw size={18} />{isSaving ? "Aguarde..." : "Atualizar ciclo"}</button><Link href="/cycle" className="ml-4 inline-flex min-h-12 items-center font-semibold">Ver ciclo</Link></section>
    </>}
  </div><BottomNavigation /></main>;
}
