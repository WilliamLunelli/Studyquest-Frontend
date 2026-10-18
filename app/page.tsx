import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function EntryPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-page text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="StudyQuest, início" className="font-display text-2xl font-extrabold tracking-tight">
            StudyQuest<span className="text-accent">.</span>
          </Link>
          <ThemeToggle />
        </header>

        <section className="flex flex-1 items-center py-12 lg:py-16">
          <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted">
              <Sparkles size={16} className="text-accent" aria-hidden="true" />
              Sua rotina de estudos, com direção
            </span>
            <h1 className="mt-7 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Você não precisa decidir <span className="text-accent">o que estudar hoje.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              O StudyQuest monta seu ciclo pelo peso das matérias no seu objetivo, acompanha seu tempo de foco e ajuda a voltar aos assuntos na hora certa.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-accent px-7 text-lg font-bold text-white transition hover:brightness-95">
                Criar conta <ArrowRight size={19} aria-hidden="true" />
              </Link>
              <Link href="/login" className="inline-flex min-h-14 items-center justify-center rounded-full border border-border bg-surface px-7 text-lg font-semibold transition hover:border-accent hover:text-accent">
                Entrar
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm text-muted">
              <span className="inline-flex items-center gap-2"><Clock3 size={16} aria-hidden="true" /> Ciclo pronto em poucos passos</span>
              <span>Vestibular, ENEM e concursos</span>
            </div>
          </div>

        </section>

        <footer className="border-t border-border py-5 text-center text-xs text-muted">
          Um passo de cada vez. Seu histórico fica salvo na sua conta.
        </footer>
      </div>
    </main>
  );
}
