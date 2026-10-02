"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OnboardingError, OnboardingShell } from "@/components/OnboardingShell";
import { saveAvailability, type AvailabilityDay } from "@/lib/services/onboarding-client";

const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function AvailabilityOnboardingPage() {
  const router = useRouter();
  const [minutes, setMinutes] = useState<number[]>(Array(7).fill(0));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleContinue() {
    setIsSaving(true);
    setMessage("");
    const disponibilidade: AvailabilityDay[] = minutes.map((minutos, diaSemana) => ({ diaSemana, minutos }));
    const result = await saveAvailability(disponibilidade);
    if (result.status === "ok") router.push("/onboarding/difficulties");
    else setMessage(result.message);
    setIsSaving(false);
  }

  return <OnboardingShell step={2} title="Quando você estuda?" description="Informe quantos minutos consegue reservar para cada dia da semana.">
    <div className="space-y-3">{weekdays.map((day, index) => <label key={day} className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-surface p-4"><span className="font-semibold">{day}</span><span className="flex items-center gap-2"><input type="number" min={0} max={960} step={30} value={minutes[index]} onChange={(event) => setMinutes((current) => current.map((value, itemIndex) => itemIndex === index ? Number(event.target.value) : value))} className="h-12 w-24 rounded-2xl border border-border bg-surface-muted px-3 text-center text-lg text-foreground outline-none focus:border-accent" /><span className="text-sm text-muted">min</span></span></label>)}</div>
    <OnboardingError message={message} />
    <button type="button" disabled={isSaving} onClick={() => void handleContinue()} className="mt-6 min-h-14 w-full rounded-full bg-accent px-5 text-lg font-semibold text-white disabled:opacity-50">{isSaving ? "Salvando..." : "Continuar"}</button>
  </OnboardingShell>;
}