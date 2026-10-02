import Link from "next/link";

export function OnboardingShell({ step, title, description, children }: { step: number; title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-page px-5 py-7 text-foreground sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-xl">
        <header className="flex items-center justify-between border-b border-border pb-7">
          <Link href="/dashboard" className="font-display text-3xl font-semibold tracking-tight">StudyQuest</Link>
          <span className="text-sm font-semibold text-muted">Etapa {step} de 3</span>
        </header>
        <div className="mt-8 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(step / 3) * 100}%` }} /></div>
        <section className="mt-9"><h1 className="font-display text-4xl font-semibold leading-tight">{title}</h1><p className="mt-4 text-lg leading-7 text-muted">{description}</p></section>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

export function OnboardingError({ message }: { message: string }) {
  return message ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{message}</p> : null;
}

export function OnboardingLoading({ message }: { message: string }) {
  return <OnboardingShell step={1} title="Preparando seu ciclo" description={message}><div className="rounded-3xl border border-border bg-surface p-7 text-center text-muted">Aguardando dados do backend...</div></OnboardingShell>;
}