"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fetchPerformance, type PerformanceMetrics } from "@/lib/services/performance-client";
import { BottomNavigation } from "@/components/BottomNavigation";

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
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  useEffect(() => {
    setIsLoading(true);
    void fetchPerformance(period).then((result) => {
      if (result.status === "ok") setMetrics(result.data);
      else { setMetrics(null); setMessage(result.message); }
      setIsLoading(false);
    });
  }, [period]);

  if (isLoading && !metrics) return <AnalyticsState title="Carregando desempenho" message={`Buscando seus dados dos últimos ${period === "7d" ? "7" : period === "30d" ? "30" : "90"} dias.`} />;
  if (!metrics) return <AnalyticsState title="Desempenho indisponível" message={message || "Registre atividades de estudo para acompanhar seus indicadores."} />;

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
          <label className="flex items-center gap-2 text-sm font-semibold text-muted">Período
            <select aria-label="Período do desempenho" value={period} onChange={(event) => setPeriod(event.target.value as "7d" | "30d" | "90d")} className="min-h-11 rounded-xl border border-border bg-surface px-3 text-foreground">
              <option value="7d">7 dias</option><option value="30d">30 dias</option><option value="90d">90 dias</option>
            </select>
          </label>
        </div>

        <section className="mt-5 grid grid-cols-1 gap-6 rounded-[2rem] border border-border bg-surface px-7 py-8 sm:grid-cols-3 sm:gap-4">
          <Metric label="estudados" value={formatHours(totalStudied)} detail={`Meta: ${formatHours(totalTarget)}`} />
          <Metric label="de sequência" value={`${metrics.streak.atual} dias`} detail="Sequência atual" />
          <Metric label="em questões" value={accuracy === null ? "--" : `${accuracy}%`} detail="Acertos em questões" />
        </section>

        <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Cobertura e recordes">
          <article className="rounded-3xl border border-border bg-surface p-5"><p className="text-sm text-muted">Cobertura do catálogo</p><p className="mt-2 font-display text-2xl font-semibold">{metrics.cobertura.percentual}%</p><p className="mt-1 text-sm text-muted">{metrics.cobertura.assuntosVistos} de {metrics.cobertura.assuntosTotais} assuntos</p></article>
          <article className="rounded-3xl border border-border bg-surface p-5"><p className="text-sm text-muted">Recorde de sequência</p><p className="mt-2 font-display text-2xl font-semibold">{metrics.streak.recorde} dias</p></article>
          <article className="rounded-3xl border border-border bg-surface p-5"><p className="text-sm text-muted">Escudos disponíveis</p><p className="mt-2 font-display text-2xl font-semibold">{metrics.streak.escudosDisponiveis}</p></article>
          <article className="rounded-3xl border border-border bg-surface p-5"><p className="text-sm text-muted">Aderência ao ciclo</p><p className="mt-2 font-display text-2xl font-semibold">{metrics.aderenciaCiclo.percentual}%</p><p className="mt-1 text-sm text-muted">{metrics.aderenciaCiclo.blocosConcluidos} de {metrics.aderenciaCiclo.blocosPlanejados} blocos</p></article>
        </section>
        <section className="mt-8 rounded-[2rem] border border-border bg-surface p-7 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Peso na prova vs. horas estudadas</h2>
          <div className="mt-8 space-y-8">
            {metrics.horasPorMateria.map((item) => (
              <div key={item.subjectId}>
                <div className="flex items-center justify-between gap-4 text-lg"><span>{item.materia}</span><span>{formatHours(item.minutosReaisSemana)} de {formatHours(item.minutosIdeaisSemana)}</span></div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="w-4 h-4 bg-[#f21b52]" />
                    <span>Suas horas</span>
                  </div>
                  <Bar color="bg-[#f21b52]" value={item.minutosReaisSemana} max={maxMinutes} />
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="w-4 h-4 bg-accent" />
                    <span>Peso ideal</span>
                  </div>
                  <Bar color="bg-accent" value={item.minutosIdeaisSemana} max={maxMinutes} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-border bg-surface p-7 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Acertos por assunto</h2>
          {metrics.acertoPorAssunto.length ? <div className="mt-5 divide-y divide-border">{metrics.acertoPorAssunto.map((item) => <div key={item.topicId} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold">{item.assunto}</p><p className="mt-1 text-sm text-muted">{item.materia} · {item.acertadas}/{item.feitas} questões</p></div><span className="rounded-full bg-accent-soft px-4 py-2 font-semibold text-accent">{item.percentual}%</span></div>)}</div> : <p className="mt-4 text-muted">Registre questões para acompanhar seu acerto por assunto.</p>}
        </section>

        {confidence ? <section className="mt-8 rounded-[2rem] border border-border bg-surface p-7 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-[#f21b52]">Excesso em confiança</h2>
          <p className="mt-6 text-xl font-semibold leading-8">Você marcou “tranquilo” em {confidence.assunto} mas está com {confidence.percentualAcerto}% de acertos</p>
          <p className="mt-4 text-base leading-7 text-muted">As revisões voltaram para 1 dia, pratique questões antes de prosseguir</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link href={`/session?subject=${encodeURIComponent(confidence.materia)}&topic=${encodeURIComponent(confidence.assunto)}`} className="inline-flex min-h-14 items-center rounded-2xl bg-surface-muted px-5 font-semibold">Fazer questões</Link><button type="button" className="min-h-14 rounded-2xl bg-surface-muted px-5 font-semibold">Ignorar</button></div>
        </section> : null}
      </div>
      <BottomNavigation />
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div><p className="font-display text-2xl font-semibold leading-tight">{value} <span className="text-base font-normal">{label}</span></p><p className="mt-2 text-lg">{detail}</p></div>;
}

function Bar({ color, value, max }: { color: string; value: number; max: number }) {
  return <div className={`h-5 ${color}`} style={{ width: `${Math.max(value > 0 ? 2 : 0, Math.min(100, (value / max) * 100))}%` }} />;
}



function AnalyticsState({ title, message }: { title: string; message: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-page px-5 text-foreground"><div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-7 text-center"><h1 className="font-display text-2xl font-semibold">{title}</h1><p className="mt-3 leading-7 text-muted">{message}</p><Link href="/dashboard" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 font-semibold text-white">Voltar para Home</Link></div></main>;
}
