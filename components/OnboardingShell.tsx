import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function OnboardingShell({ step, title, description, children, onBack }: { step: number; title: string; description: string; children: React.ReactNode; onBack?: () => void }) {
  return (
    <main className="min-h-dvh bg-page px-5 py-5 text-foreground sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-center justify-between border-b border-border pb-5">
          {onBack ? <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted transition hover:text-accent"><ArrowLeft size={17} aria-hidden="true" /> Voltar</button> : <Link href="/" className="font-display text-xl font-extrabold tracking-tight">StudyQuest<span className="text-accent">.</span></Link>}
          <span className="text-xs font-bold uppercase tracking-[.12em] text-muted">Passo {step} de 6</span>
        </header>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${(step / 6) * 100}%` }} /></div>
        <section className="mt-8"><h1 className="max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h1><p className="mt-3 max-w-xl text-base leading-7 text-muted sm:text-lg">{description}</p></section>
        <div className="mt-7">{children}</div>
      </div>
    </main>
  );
}

export function OnboardingError({ message }: { message: string }) {
  return message ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{message}</p> : null;
}

export function OnboardingLoading({ message }: { message: string }) {
  return <OnboardingShell step={1} title="Preparando seu ciclo" description={message}><div className="rounded-3xl border border-border bg-surface p-7 text-center text-muted">Carregando seus dados...</div></OnboardingShell>;
}
