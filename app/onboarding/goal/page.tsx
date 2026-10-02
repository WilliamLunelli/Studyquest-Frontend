"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingError, OnboardingLoading, OnboardingShell } from "@/components/OnboardingShell";
import { fetchGoals, saveOnboardingGoal, type Goal } from "@/lib/services/onboarding-client";

export default function GoalOnboardingPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState("");
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

  async function handleContinue() {
    if (!selectedGoal) return setMessage("Escolha um objetivo para continuar.");
    setIsSaving(true);
    setMessage("");
    const result = await saveOnboardingGoal(selectedGoal);
    if (result.status === "ok") {
      const goal = goals.find((item) => item.id === selectedGoal);
      sessionStorage.setItem("studyquest_onboarding_goal", JSON.stringify({ id: selectedGoal, nome: goal?.nome ?? "" }));
      router.push("/onboarding/availability");
    } else setMessage(result.message);
    setIsSaving(false);
  }

  if (isLoading) return <OnboardingLoading message="Carregando os objetivos disponíveis." />;

  return <OnboardingShell step={1} title="Qual é seu objetivo?" description="Escolha a prova ou meta que vai orientar seu ciclo de estudos.">
    <div className="space-y-3">
      {goals.map((goal) => <button key={goal.id} type="button" onClick={() => setSelectedGoal(goal.id)} className={`w-full rounded-3xl border p-5 text-left transition ${selectedGoal === goal.id ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent"}`}><span className="font-display text-xl font-semibold">{goal.nome}</span><span className="mt-2 block text-sm text-muted">{goal.instituicao ?? goal.tipo}</span></button>)}
    </div>
    {goals.length === 0 ? <p className="rounded-3xl border border-border bg-surface p-6 text-muted">O backend ainda não enviou objetivos disponíveis.</p> : null}
    <OnboardingError message={message} />
    <button type="button" disabled={isSaving || !goals.length} onClick={() => void handleContinue()} className="mt-6 min-h-14 w-full rounded-full bg-accent px-5 text-lg font-semibold text-white disabled:opacity-50">{isSaving ? "Salvando..." : "Continuar"}</button>
  </OnboardingShell>;
}