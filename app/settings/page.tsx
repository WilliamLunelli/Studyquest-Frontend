"use client";

import Link from "next/link";
import { ArrowLeft, Target, CalendarDays, Brain, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  fetchGoals,
  saveOnboardingGoal,
  fetchGoalWeights,
  saveDifficulties,
  saveAvailability,
  getAvailabilityStorageKey,
  type Goal,
  type GoalWeight,
  type AvailabilityDay,
} from "@/lib/services/onboarding-client";
import { BottomNavigation } from "@/components/BottomNavigation";
import { getAuthHeader } from "@/lib/api-config";
import { generateCycle } from "@/lib/services/cycle-client";

const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type Step = "goal" | "availability" | "difficulties";
type AvailabilitySource = "saved" | "suggested" | "unavailable";

export default function SettingsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("goal");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [minutes, setMinutes] = useState<number[]>(Array(7).fill(0));
  const [availabilitySource, setAvailabilitySource] = useState<AvailabilitySource>("unavailable");
  const [weights, setWeights] = useState<GoalWeight[]>([]);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void fetchGoals().then((result) => {
      if (result.status === "ok") setGoals(result.data);
      else setMessage(result.message);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (step === "availability") {
      void fetchAvailability();
    }
  }, [step]);

  async function fetchAvailability() {
    const storageKey = getAvailabilityStorageKey();
    let savedAvailability: string | null = null;
    try {
      savedAvailability = storageKey ? window.localStorage.getItem(storageKey) : null;
    } catch {
      setAvailabilitySource("unavailable");
    }
    if (savedAvailability) {
      try {
        const parsed = JSON.parse(savedAvailability) as AvailabilityDay[];
        const hasSevenUniqueDays = new Set(parsed.map((day) => day.diaSemana)).size === 7;
        if (parsed.length === 7 && hasSevenUniqueDays && parsed.every((day) => Number.isInteger(day.diaSemana) && day.diaSemana >= 0 && day.diaSemana <= 6 && Number.isInteger(day.minutos) && day.minutos >= 0 && day.minutos <= 960)) {
          const savedMinutes = Array<number>(7).fill(0);
          parsed.forEach((day) => { savedMinutes[day.diaSemana] = day.minutos; });
          setMinutes(savedMinutes);
          setAvailabilitySource("saved");
          return;
        }
      } catch {
        if (storageKey) window.localStorage.removeItem(storageKey);
      }
    }

    try {
      const response = await fetch("/api/home", {
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setAvailabilitySource("unavailable");
        return;
      }
      if (typeof payload?.streak?.metaDiariaMin === "number" && payload.streak.metaDiariaMin > 0) {
        const defaultMin = Math.round(payload.streak.metaDiariaMin / 7) || 60;
        setMinutes(Array(7).fill(defaultMin));
        setAvailabilitySource("suggested");
      } else {
        setAvailabilitySource("unavailable");
      }
    } catch {
      setAvailabilitySource("unavailable");
    }
  }

  async function handleGoalSave() {
    if (!selectedGoal) return setMessage("Escolha um objetivo.");
    setIsSaving(true);
    setMessage("");
    const result = await saveOnboardingGoal(selectedGoal);
    if (result.status === "ok") {
      const weightsResult = await fetchGoalWeights(selectedGoal);
      if (weightsResult.status !== "ok") {
        setMessage(weightsResult.message);
        setIsSaving(false);
        return;
      }

      setWeights(weightsResult.data);
      const goal = goals.find((g) => g.id === selectedGoal);
      sessionStorage.setItem("studyquest_onboarding_goal", JSON.stringify({ id: selectedGoal, nome: goal?.nome ?? "" }));
      setStep("availability");
    } else setMessage(result.message);
    setIsSaving(false);
  }

  async function handleAvailabilitySave() {
    setIsSaving(true);
    setMessage("");
    const disponibilidade: AvailabilityDay[] = minutes.map((minutos, diaSemana) => ({ diaSemana, minutos }));
    const result = await saveAvailability(disponibilidade);
    if (result.status === "ok") {
      if (weights.length > 0) setStep("difficulties");
      else {
        sessionStorage.removeItem("studyquest_onboarding_goal");
        router.push("/dashboard");
      }
    } else setMessage(result.message);
    setIsSaving(false);
  }

  async function handleDifficultiesSave() {
    const subjects = weights.flatMap((w) => w.subjects);
    setIsSaving(true);
    setMessage("");
    const result = await saveDifficulties(
      subjects.map((s) => ({ subjectId: s.id, nivel: levels[s.id] ?? 3 }))
    );
    if (result.status === "ok") {
      const cycleResult = await generateCycle();
      if (cycleResult.status === "ok") {
        sessionStorage.removeItem("studyquest_onboarding_goal");
        router.push("/dashboard");
      } else {
        setMessage(`Configurações salvas, mas não foi possível gerar o ciclo: ${cycleResult.message}`);
      }
    } else setMessage(result.message);
    setIsSaving(false);
  }

  const stepConfig = {
    goal: { title: "Qual é seu objetivo?", description: "Escolha a prova ou meta que vai orientar seu ciclo de estudos.", icon: <Target size={24} /> },
    availability: { title: "Quando você estuda?", description: "Informe quantos minutos consegue reservar para cada dia da semana.", icon: <CalendarDays size={24} /> },
    difficulties: { title: "Como você se sente em cada matéria?", description: "Sua autoavaliação ajuda a distribuir o peso do ciclo.", icon: <Brain size={24} /> },
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-page pb-28 text-foreground">
        <div className="mx-auto w-full max-w-2xl px-5 pt-7 sm:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="font-display text-3xl font-semibold tracking-tight">StudyQuest</Link>
            <ThemeToggle />
          </header>
          <div className="mt-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  const { title, description, icon } = stepConfig[step];

  return (
    <main className="min-h-screen bg-page pb-28 text-foreground">
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-7 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-accent">
            <ArrowLeft aria-hidden="true" size={17} /> Voltar
          </Link>
          <ThemeToggle />
        </header>
        <div className="mt-7 h-px bg-border" />

        <div className="mt-8">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-accent-soft p-2 text-accent">{icon}</span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Configurações</p>
              <h1 className="mt-1 font-display text-3xl font-semibold leading-tight">{title}</h1>
              <p className="mt-2 text-base leading-7 text-muted">{description}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Passos da configuração">
            {["goal", "availability", "difficulties"].map((s, i) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={step === s}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                  step === s ? "bg-accent text-white" : "bg-surface-muted text-muted hover:text-accent"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {message && (
            <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</p>
          )}

          {step === "goal" && (
            <div className="mt-8 space-y-3">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`w-full rounded-3xl border p-5 text-left transition ${
                    selectedGoal === goal.id ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent"
                  }`}
                >
                  <span className="font-display text-xl font-semibold">{goal.nome}</span>
                  <span className="mt-2 block text-sm text-muted">{goal.instituicao ?? goal.tipo}</span>
                </button>
              ))}
              {goals.length === 0 && (
                <p className="rounded-3xl border border-border bg-surface p-6 text-muted">
                  Nenhum objetivo disponível para selecionar.
                </p>
              )}
            </div>
          )}

          {step === "availability" && (
            <div className="mt-8 space-y-3">
              <p className="rounded-2xl border border-border bg-surface-muted p-4 text-sm leading-6 text-muted">
                {availabilitySource === "saved"
                  ? "Exibindo sua última disponibilidade salva."
                  : availabilitySource === "suggested"
                    ? "Estes valores são uma sugestão baseada na sua meta diária. Ajuste-os para organizar sua semana."
                    : "Informe quantos minutos pretende estudar em cada dia."}
              </p>
              {weekdays.map((day, index) => (
                <label key={day} className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-surface p-4">
                  <span className="font-semibold">{day}</span>
                  <span className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={960}
                      step={30}
                      value={minutes[index]}
                      onChange={(event) =>
                        setMinutes((current) =>
                          current.map((value, itemIndex) =>
                            itemIndex === index ? Number(event.target.value) : value
                          )
                        )
                      }
                      className="h-12 w-24 rounded-2xl border border-border bg-surface-muted px-3 text-center text-lg text-foreground outline-none focus:border-accent"
                    />
                    <span className="text-sm text-muted">min</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {step === "difficulties" && (
            <div className="mt-8 space-y-4">
              {weights.flatMap((weight) =>
                weight.subjects.map((subject) => (
                  <div key={subject.id} className="rounded-3xl border border-border bg-surface p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-xl font-semibold">{subject.nome}</h2>
                        <p className="mt-1 text-sm text-muted">{weight.area}</p>
                      </div>
                      <span className="rounded-full bg-accent-soft px-3 py-2 text-sm font-semibold text-accent">
                        {levels[subject.id] ?? 3}/5
                      </span>
                    </div>
                    <input
                      aria-label={`Dificuldade em ${subject.nome}`}
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={levels[subject.id] ?? 3}
                      onChange={(event) =>
                        setLevels((current) => ({
                          ...current,
                          [subject.id]: Number(event.target.value),
                        }))
                      }
                      className="mt-5 w-full accent-[#974fc9]"
                    />
                    <div className="mt-2 flex justify-between text-xs text-muted">
                      <span>Tenho facilidade</span>
                      <span>Preciso reforçar</span>
                    </div>
                  </div>
                ))
              )}
              {weights.length === 0 && (
                <p className="rounded-3xl border border-border bg-surface p-6 text-muted">
                  Nenhuma matéria está associada a este objetivo no momento.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step !== "goal" && (
              <button
                type="button"
                onClick={() => {
                  if (step === "availability") setStep("goal");
                  else if (step === "difficulties") setStep("availability");
                  setMessage("");
                }}
                className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 text-lg font-semibold text-muted transition hover:border-accent hover:text-accent"
              >
                <ArrowLeft size={20} /> Voltar
              </button>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                if (step === "goal") handleGoalSave();
                else if (step === "availability") handleAvailabilitySave();
                else handleDifficultiesSave();
              }}
              className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 text-lg font-semibold text-white disabled:opacity-50 disabled:cursor-wait"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : step === "difficulties" ? (
                "Concluir"
              ) : (
                <>
                  Continuar
                  <Save size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <BottomNavigation />
    </main>
  );
}
