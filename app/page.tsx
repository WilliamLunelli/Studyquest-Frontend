const navLinks = [
  { href: "#sobre", label: "Mais sobre a plataforma" },
  { href: "#contato", label: "Fale com a gente" },
];

const problemItems = [
  {
    title: "Falta de clareza no progresso",
    description:
      "A pesquisa do projeto mostrou que muitos estudantes não registram horas e enxergam o próprio progresso apenas de forma parcial.",
  },
  {
    title: "Constância quebrada no dia a dia",
    description:
      "As maiores dificuldades identificadas foram distrações, cansaço e falta de organização para manter uma rotina autônoma.",
  },
];

const solutionItems = [
  {
    title: "Registro diário de estudo",
    description:
      "Registre matéria, tempo, questões resolvidas e produtividade em poucos toques, com foco no fluxo principal do MVP.",
  },
  {
    title: "Gamificação automática",
    description:
      "XP, nível, streak e badges são atualizados automaticamente a cada registro para reforçar motivação e constância.",
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden text-slate-900">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-[#9FE4F1]/55 blur-3xl" />
        <div className="absolute right-[-6rem] top-20 h-72 w-72 rounded-full bg-[#F2AE8F]/45 blur-3xl" />
      </div>

      <header className="border-b border-[#974FC9]/10 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:gap-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-semibold tracking-wide">StudyQuest</h1>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition hover:text-[#6b2fa3]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#"
              className="rounded-full border border-[#974FC9]/25 bg-white px-3 py-2 text-xs font-medium text-[#6b2fa3] transition hover:bg-[#f7effd] sm:px-4 sm:text-sm"
            >
              Cadastrar
            </a>
            <a
              href="/login"
              className="rounded-full bg-[#974FC9] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#873abf] sm:px-4 sm:text-sm"
            >
              Entrar
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div className="space-y-6">
          <p className="inline-flex items-center rounded-full border border-[#9FE4F1] bg-[#9FE4F1]/35 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#2b6470]">
            Plataforma de estudos
          </p>
          <h2 className="font-display text-5xl font-semibold leading-tight sm:text-6xl">
            Aprender pode ser leve, organizado e constante.
          </h2>
          <p className="max-w-xl text-lg leading-8 text-slate-600">
            Quer montar uma rotina focada para estudar sozinho ou com seu grupo? Comece em
            minutos e acompanhe sua evolução com clareza.
          </p>
          <a
            href="#menu"
            className="inline-flex rounded-full bg-[#974FC9] px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] hover:bg-[#873abf]"
          >
            Ver desafios e solução
          </a>
        </div>

        <div className="relative">
          <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-[#9FE4F1]/55 blur-2xl" />
          <div className="absolute -bottom-8 -right-4 h-32 w-32 rounded-full bg-[#F2AE8F]/45 blur-2xl" />

          <div className="rounded-[2rem] border border-[#974FC9]/15 bg-gradient-to-br from-[#F2AE8F]/55 via-[#fce7de] to-[#9FE4F1]/45 p-5 shadow-xl shadow-[#974FC9]/10">
            <div className="rounded-[1.4rem] border border-white/60 bg-white/80 p-6 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#6b2fa3]">
                Painel semanal
              </p>
              <h3 className="mt-4 font-display text-3xl font-semibold text-slate-900">
                12 tarefas
                <br />
                9 concluídas
              </h3>
              <div className="mt-6 h-3 rounded-full bg-[#974FC9]/10">
                <div className="h-3 w-3/4 rounded-full bg-gradient-to-r from-[#974FC9] to-[#9FE4F1]" />
              </div>
              <p className="mt-2 text-sm text-slate-600">Seu ritmo está 23% acima da semana passada.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto w-full max-w-7xl px-6 pb-8 lg:px-8">
        <div className="mb-8 text-center">
        
          <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Problemas reais e solução proposta</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#F2AE8F]/40 bg-gradient-to-br from-[#fff7f3] via-white to-[#ffeadd] p-6 shadow-sm">
            <p className="inline-flex rounded-full border border-[#F2AE8F]/50 bg-[#F2AE8F]/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a4f2d]">
              Problemas mapeados
            </p>
            <div className="mt-5 space-y-4">
              {problemItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#f3d2bf] bg-white/85 p-4">
                  <h3 className="font-display text-2xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-[#9FE4F1]/40 bg-gradient-to-br from-[#eefbfe] via-white to-[#e2f7fb] p-6 shadow-sm">
            <p className="inline-flex rounded-full border border-[#9FE4F1]/70 bg-[#9FE4F1]/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2a6b77]">
              Solução StudyQuest
            </p>
            <div className="mt-5 space-y-4">
              {solutionItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#bfe9f0] bg-white/90 p-4">
                  <h3 className="font-display text-2xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section id="sobre" className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
        <div className="rounded-3xl border border-[#974FC9]/20 bg-[#974FC9] px-6 py-10 text-white sm:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold">Pronto para sair do modo "depois eu vejo"?</h2>
              <p className="mt-2 max-w-2xl text-white/85">
                Crie sua conta e teste uma trilha de estudos agora.
              </p>
            </div>
            <a
              href="/login"
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Começar agora
            </a>
          </div>
        </div>
      </section>

      <footer id="contato" className="border-t border-[#974FC9]/10 bg-white py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-2 px-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:px-8">
          <p>Copyright © StudyQuest 2026</p>
          <p>Contato: andre.carvalho0317@gmail.com</p>
        </div>
      </footer>
    </main>
  );
}
