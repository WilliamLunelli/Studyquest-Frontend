interface SubjectCardProps {
  title: string;
  meta: string;
  duration: string;
  gradient: string;
  areaName?: string;
}

export function SubjectCard({ title, meta, duration, gradient }: SubjectCardProps) {
  return (
    <article className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      <div className={`relative h-30 overflow-hidden rounded-xl bg-gradient-to-br sm:h-32 ${gradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,0.6),transparent_40%)]" />
        <div className="absolute bottom-2 left-2 rounded-full bg-black/45 px-2 py-1 text-[11px] text-white">
          ◷ {duration}
        </div>
      </div>
      <h3 className="mt-3 break-words font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">{title}</h3>
      <p className="mt-1 text-right text-sm text-slate-400">{meta}</p>
      <button
        type="button"
        className="mt-3 w-full rounded-full bg-[#974FC9]/10 px-4 py-2 text-sm font-medium text-[#974FC9] transition hover:bg-[#974FC9]/15"
      >
        Adicionar tópicos
      </button>
    </article>
  );
}
