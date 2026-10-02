"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingError, OnboardingLoading, OnboardingShell } from "@/components/OnboardingShell";
import { fetchGoalWeights, saveDifficulties, type GoalWeight } from "@/lib/services/onboarding-client";

export default function DifficultiesOnboardingPage() {
  const router = useRouter();
  const [weights, setWeights] = useState<GoalWeight[]>([]);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("studyquest_onboarding_goal");
    const goalId = stored ? (JSON.parse(stored) as { id?: string }).id : null;
    if (!goalId) {
      router.replace("/onboarding/goal");
      return;
    }
    void fetchGoalWeights(goalId).then((result) => {
      if (result.status === "ok") setWeights(result.data);
      else setMessage(result.message);
      setIsLoading(false);
    });
  }, [router]);

  async function handleFinish() {
    const subjects = weights.flatMap((weight) => weight.subjects);
    setIsSaving(true);
    setMessage("");
    const result = await saveDifficulties(subjects.map((subject) => ({ subjectId: subject.id, nivel: levels[subject.id] ?? 3 })));
    if (result.status === "ok") {
      sessionStorage.removeItem("studyquest_onboarding_goal");
      router.push("/dashboard");
    } else setMessage(result.message);
    setIsSaving(false);
  }

  if (isLoading) return <OnboardingLoading message="Carregando as matérias do seu objetivo." />;
  const subjects = weights.flatMap((weight) => weight.subjects.map((subject) => ({ ...subject, area: weight.area })));

  return <OnboardingShell step={3} title="Como você se sente em cada matéria?" description="Sua autoavaliação ajuda a distribuir o peso do ciclo. Você poderá ajustar isso depois.">
    <div className="space-y-4">{subjects.map((subject) => <div key={subject.id} className="rounded-3xl border border-border bg-surface p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">{subject.nome}</h2><p className="mt-1 text-sm text-muted">{subject.area}</p></div><span className="rounded-full bg-accent-soft px-3 py-2 text-sm font-semibold text-accent">{levels[subject.id] ?? 3}/5</span></div><input aria-label={`Dificuldade em ${subject.nome}`} type="range" min={1} max={5} step={1} value={levels[subject.id] ?? 3} onChange={(event) => setLevels((current) => ({ ...current, [subject.id]: Number(event.target.value) }))} className="mt-5 w-full accent-[#974fc9]" /><div className="mt-2 flex justify-between text-xs text-muted"><span>Tenho facilidade</span><span>Preciso reforçar</span></div></div>)}</div>
    {subjects.length === 0 ? <p className="rounded-3xl border border-border bg-surface p-6 text-muted">O backend ainda não enviou matérias para este objetivo.</p> : null}
    <OnboardingError message={message} />
    <button type="button" disabled={isSaving || !subjects.length} onClick={() => void handleFinish()} className="mt-6 min-h-14 w-full rounded-full bg-accent px-5 text-lg font-semibold text-white disabled:opacity-50">{isSaving ? "Montando seu ciclo..." : "Concluir configuração"}</button>
  </OnboardingShell>;
}