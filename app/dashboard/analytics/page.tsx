"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fetchPerformance, type PerformanceMetrics } from "@/lib/services/performance-client";

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1).replace(".", ",")}h`;
}

function averageAccuracy(metrics: PerformanceMetrics) {
  const totalQuestions = metrics.acertoPorAssunto.reduce((sum, item) => sum + item.feitas, 0);
  if (!totalQuestions) return null;
  const correctAnswers = metrics.acertoPorAssunto.reduce((sum, item) => sum + item.acertadas, 0);
  return Math.round((correctAnswers / totalQuestions) * 100);
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchPerformance().then((result) => {
      if (result.status === "ok") setMetrics(result.data);
      else setMessage(result.message);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <AnalyticsState title="Carregando desempenho" message="Buscando seus dados dos últimos 7 dias." />;
  if (!metrics) return <AnalyticsState title="Dados aguardando o backend" message={message || "As métricas aparecerão aqui quando o backend enviar os dados."} />;

  const totalStudied = metrics.horasPorMateria.reduce((sum, item) => sum + item.minutosReaisSemana, 0);
  const totalTarget = metrics.horasPorMateria.reduce((sum, item) => sum + item.minutosIdeaisSemana, 0);
  const accuracy = averageAccuracy(metrics);
  const maxMinutes = Math.max(...metrics.horasPorMateria.map((item) => item.minutosIdeaisSemana), 1);
  const confidence = metrics.excessoConfianca[0];

  return (
    <main className="min-h-screen bg-page pb-24 text-foreground">
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-6 sm:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-7">
          <Link href="/dashboard" className="font-display text-3xl font-semibold tracking-tight">StudyQuest</Link>
          <ThemeToggle />
        </header>

        <div className="mt-8 flex items-end justify-between gap-4">
          <h1 className="font-display text-2xl font-medium sm:text-3xl">Seu desempenho</h1>
          <span className="text-xl text-muted">últimos 7</span>
        </div>

        <section className="mt-5 grid grid-cols-1 gap-6 rounded-[2rem] border border-border bg-surface px-7 py-8 sm:grid-cols-3 sm:gap-4">
          <Metric label="estudados" value={formatHours(totalStudied)} detail={`Meta: ${formatHours(totalTarget)}`} />
          <Metric label="de sequência" value={`${metrics.streak.atual} dias`} detail="Sequência atual" />
          <Metric label="em questões" value={accuracy === null ? "--" : `${accuracy}%`} detail="Acertos em questões" />
        </section>

        <section className="mt-8 rounded-[2rem] border border-border bg-surface p-7 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Peso na prova vs. horas estudadas</h2>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-lg">
            <Legend color="bg-accent" label="Peso ideal" />
            <Legend color="bg-[#f21b52]" label="Suas horas" />
          </div>
          <div className="mt-8 space-y-8">
            {metrics.horasPorMateria.map((item) => (
              <div key={item.subjectId}>
                <div className="flex items-center justify-between gap-4 text-lg"><span>{item.materia}</span><span>{formatHours(item.minutosReaisSemana)} de {formatHours(item.minutosIdeaisSemana)}</span></div>
                <div className="mt-3 space-y-1.5">
                  <Bar color="bg-accent" value={item.minutosIdeaisSemana} max={maxMinutes} />
                  <Bar color="bg-[#f21b52]" value={item.minutosReaisSemana} max={maxMinutes} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {confidence ? <section className="mt-8 rounded-[2rem] border border-border bg-surface p-7 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-[#f21b52]">Excesso em confiança</h2>
          <p className="mt-6 text-xl font-semibold leading-8">Você marcou “tranquilo” em {confidence.assunto} mas está com {confidence.percentualAcerto}% de acertos</p>
          <p className="mt-4 text-base leading-7 text-muted">As revisões voltaram para 1 dia, pratique questões antes de prosseguir</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link href={`/session?subject=${encodeURIComponent(confidence.materia)}&topic=${encodeURIComponent(confidence.assunto)}`} className="inline-flex min-h-14 items-center rounded-2xl bg-surface-muted px-5 font-semibold">Fazer questões</Link><button type="button" className="min-h-14 rounded-2xl bg-surface-muted px-5 font-semibold">Ignorar</button></div>
        </section> : null}
      </div>
      <AnalyticsNavigation />
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div><p className="font-display text-2xl font-semibold leading-tight">{value} <span className="text-base font-normal">{label}</span></p><p className="mt-2 text-lg">{detail}</p></div>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-2 text-lg text-accent"><span className={`h-8 w-8 ${color}`} />{label}</span>;
}

function Bar({ color, value, max }: { color: string; value: number; max: number }) {
  return <div className={`h-5 ${color}`} style={{ width: `${Math.max(value > 0 ? 2 : 0, Math.min(100, (value / max) * 100))}%` }} />;
}

function AnalyticsNavigation() {
  return <nav className="fixed inset-x-0 bottom-0 z-30 flex min-h-20 items-center justify-around border-t border-border bg-surface/95 px-5 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Navegação principal"><Link href="/dashboard" className="text-xl text-muted">Home</Link><Link href="/cycle" className="text-xl text-muted">Ciclo</Link><Link href="/dashboard/analytics" className="text-xl font-semibold text-[#f21b52]">Perfil<span className="mx-auto mt-2 block h-2 w-2 rounded-full bg-[#f21b52]" /></Link></nav>;
}

function AnalyticsState({ title, message }: { title: string; message: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-page px-5 text-foreground"><div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-7 text-center"><h1 className="font-display text-2xl font-semibold">{title}</h1><p className="mt-3 leading-7 text-muted">{message}</p><Link href="/dashboard" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 font-semibold text-white">Voltar para Home</Link></div></main>;
}