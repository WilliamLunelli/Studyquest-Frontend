"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SubjectCard } from "@/components/SubjectCard";
import { menuMain, menuProfile } from "@/lib/constants";
import { type DashboardPayload, generateObjectives } from "@/lib/frontend/dashboard";
import { type SubjectAreaFilter, matchesSubjectFilter } from "@/lib/frontend/subjects";
import { fetchDashboardClient } from "@/lib/services/dashboard-client";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<SubjectAreaFilter>("Todas");
  const router = useRouter();

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");

      const result = await fetchDashboardClient();

      if (result.status === "unauthorized") {
        router.push("/login");
        return;
      }

      if (result.status === "error") {
        setErrorMessage(result.message);
        setIsLoading(false);
        return;
      }

      if (result.status === "ok") {
        setData(result.data);
      }

      setIsLoading(false);
    }

    void loadDashboard();
  }, [router]);

  const weeklyTopics = data?.stats.weeklyTopics ?? 0;
  const totalXp = data?.stats.totalXp ?? 0;
  const weeklyGrowth = data?.stats.weeklyGrowth ?? 0;
  const allPendingSubjects = data?.pendingSubjects ?? [];
  const pendingSubjects = allPendingSubjects.filter((subject) => matchesSubjectFilter(subject.areaName, subjectFilter));
  const rankingUsers = data?.ranking ?? [];
  const objectiveSeed = data?.user.id ?? data?.user.username ?? "anonymous";

  if (isLoading && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#e8ddff_0%,#dce9ff_48%,#d8f3ff_100%)] text-slate-500">
        <div className="rounded-3xl bg-white px-6 py-4 text-sm shadow-sm ring-1 ring-black/5">
          Carregando...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#e8ddff_0%,#dce9ff_48%,#d8f3ff_100%)] text-slate-900">
      <div className="grid min-h-screen w-full grid-cols-1 gap-4 p-3 lg:grid-cols-[200px_minmax(0,1fr)] lg:p-4">
        <Sidebar menuMain={menuMain} menuProfile={menuProfile} activeIndex={0} />

        <section className="px-1 py-1 lg:px-2 lg:py-1">
          <div className="grid min-h-full grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-1">
                <label className="relative w-full max-w-[520px]">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                  <input
                    type="text"
                    placeholder="Procurar matérias, usuários"
                    className="h-11 w-full rounded-full bg-[#f4f4f4] pl-11 pr-4 text-sm text-slate-700 outline-none ring-1 ring-black/5 placeholder:text-slate-400 focus:ring-[#974FC9]/45"
                  />
                </label>

                <div className="ml-auto flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4f4f4] text-slate-500 ring-1 ring-black/5"
                    aria-label="Notificacoes"
                  >
                    <Image
                      src="/images/dashboard/notification.png"
                      alt="Notificações"
                      width={24}
                      height={24}
                    />
                  </button>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-300">
                  </div>
                </div>
              </header>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,0.88fr)_minmax(340px,1fr)]">
                <article className="rounded-2xl bg-[linear-gradient(125deg,#e70086_0%,#cb16a8_26%,#b16bd2_46%,#97b3e6_69%,#f4b8ac_100%)] p-6 text-white shadow-sm sm:p-8">
                  <h1 className="max-w-sm font-display text-4xl font-semibold leading-tight sm:text-5xl">
                    {data?.user ? `Mantenha o foco, ${data.user.username}!` : "Mantenha o foco aprendiz!"}
                  </h1>
                  <button
                    type="button"
                    className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#3946c8]"
                  >
                    Criar Tópicos
                  </button>
                </article>

                <article className="rounded-2xl bg-[#f5f5f5] p-5 shadow-sm ring-1 ring-black/5">
                  <h2 className="text-center font-display text-2xl font-semibold">Objetivos principais</h2>
                  <div className="mt-4 space-y-5">
                    {generateObjectives(objectiveSeed, allPendingSubjects).map((goal) => (
                      <div key={goal.text} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 text-sm">
                        <p className="min-w-0 break-words leading-6 text-slate-700">{goal.text}</p>
                        <p className="whitespace-nowrap text-lg text-slate-900">{goal.xp}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <section className="rounded-2xl p-1">
                <div className="flex flex-wrap items-center justify-between gap-4 px-1 pb-4">
                  <h2 className="font-display text-3xl font-semibold">Suas matérias pendentes</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <button
                      type="button"
                      onClick={() => setSubjectFilter("Humanas")}
                      className={`rounded-full px-3 py-1 transition ${subjectFilter === "Humanas" ? "bg-[#974FC9]/12 text-[#974FC9]" : "hover:bg-white/70"}`}
                    >
                      Humanas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectFilter("Exatas")}
                      className={`rounded-full px-3 py-1 transition ${subjectFilter === "Exatas" ? "bg-[#974FC9]/12 text-[#974FC9]" : "hover:bg-white/70"}`}
                    >
                      Exatas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectFilter("Todas")}
                      className={`rounded-full px-3 py-1 transition ${subjectFilter === "Todas" ? "bg-[#974FC9]/12 text-[#974FC9]" : "hover:bg-white/70"}`}
                    >
                      Todas
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {isLoading ? (
                    <p className="col-span-full rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-black/5">
                      Carregando matérias...
                    </p>
                  ) : pendingSubjects.length > 0 ? (
                    pendingSubjects.map((subject) => <SubjectCard key={subject.title} {...subject} />)
                  ) : (
                    <p className="col-span-full rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-black/5">
                      Nenhuma matéria registrada para este usuário.
                    </p>
                  )}
                </div>
              </section>
            </div>

                <aside className="space-y-3">
              {errorMessage ? (
                <article className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</article>
              ) : null}

              <article className="rounded-2xl bg-[#f5f5f5] p-5 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-slate-400">Progresso semanal</p>
                <p className="mt-1 font-display text-3xl font-semibold">{weeklyTopics} tópicos</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300/80 px-3 py-2 text-sm text-slate-500">
                  <span className={weeklyGrowth >= 0 ? "text-emerald-500" : "text-red-500"}>
                    {weeklyGrowth >= 0 ? "↑" : "↓"}
                  </span>
                  {Math.abs(weeklyGrowth)}%
                </div>
              </article>

              <article className="rounded-2xl bg-[#f5f5f5] p-5 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-slate-400">Experiência ganha</p>
                <p className="mt-1 font-display text-3xl font-semibold">{totalXp} xp</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300/80 px-3 py-2 text-sm text-slate-500">
                  <span className="text-emerald-500">↑</span>
                  Nivel {data?.user?.level ?? 1}
                </div>
              </article>

              <article className="rounded-2xl bg-[#f5f5f5] p-5 shadow-sm ring-1 ring-black/5">
                <h3 className="font-display text-3xl font-semibold">Top Ranking Amigos</h3>
                <ol className="mt-4 space-y-3">
                  {rankingUsers.map((person, index) => (
                    <li
                      key={person.id}
                      className={`flex items-center gap-3 rounded-2xl px-2 py-2 transition ${
                        person.isCurrentUser ? "bg-[#974FC9]/10 ring-1 ring-[#974FC9]/20" : ""
                      }`}
                    >
                      <span className={`w-5 text-sm font-semibold ${person.isCurrentUser ? "text-[#974FC9]" : "text-slate-600"}`}>
                        {index + 1}.
                      </span>
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full border text-slate-300 ${
                          person.isCurrentUser ? "border-[#c05df1]/40 bg-[#f5e8ff]" : "border-slate-200 bg-white"
                        }`}
                      />
                      <div>
                        <p className={`text-base font-semibold ${person.isCurrentUser ? "text-[#6f2aa8]" : "text-slate-800"}`}>
                          {person.username}
                          {person.isCurrentUser ? (
                            <span className="ml-2 rounded-full bg-[#974FC9]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#974FC9]">
                              Você
                            </span>
                          ) : null}
                        </p>
                        <p className={`text-xs ${person.isCurrentUser ? "text-[#8d56ba]" : "text-slate-400"}`}>
                          Nivel {person.level} · {person.xp} xp
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}