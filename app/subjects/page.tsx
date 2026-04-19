"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SubjectCard } from "@/components/SubjectCard";
import { menuMain, menuProfile, type SubjectCardData } from "@/lib/constants";
import { type SubjectAreaFilter, matchesSubjectFilter } from "@/lib/frontend/subjects";
import { createTempSubjectClient, fetchSubjectsClient } from "@/lib/services/subjects-client";

const areaOptions = ["Humanas", "Linguagens", "Exatas"];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [areaName, setAreaName] = useState(areaOptions[0]);
  const [subjectFilter, setSubjectFilter] = useState<SubjectAreaFilter>("Todas");
  const router = useRouter();

  useEffect(() => {
    void loadSubjects();
  }, [router]);

  async function loadSubjects() {
    setIsLoading(true);
    setErrorMessage("");

    const result = await fetchSubjectsClient();

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
      setSubjects(result.subjects);
    }

    setIsLoading(false);
  }

  const filteredSubjects = subjects.filter((subject) => matchesSubjectFilter(subject.areaName, subjectFilter));

  async function handleCreateSubject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const trimmedName = subjectName.trim();

    if (trimmedName.length < 2) {
      setErrorMessage("Informe um nome de matéria com ao menos 2 caracteres.");
      setIsSaving(false);
      return;
    }

    try {
      const newSubject = createTempSubjectClient({
        subjectName: trimmedName,
        areaName,
      });

      setSubjects((currentSubjects) => [newSubject, ...currentSubjects]);
      setSubjectName("");
      setSubjectDescription("");
      setAreaName(areaOptions[0]);
      setIsCreateOpen(false);
    } catch {
      setErrorMessage("Erro ao salvar matéria. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading && subjects.length === 0) {
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
        <Sidebar menuMain={menuMain} menuProfile={menuProfile} activeIndex={1} />

        <section className="px-1 py-1 lg:px-2 lg:py-1">
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
                  aria-label="Notificações"
                >
                  <Image
                    src="/images/dashboard/notification.png"
                    alt="Notificações"
                    width={24}
                    height={24}
                  />
                </button>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-300">
                  ○
                </div>
              </div>
            </header>

            <div className="px-1 pb-1">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="rounded-full bg-[#c9a1f2] px-4 py-1.5 text-sm font-medium text-[#7a3cb4] transition hover:brightness-95"
              >
                Adicionar matéria
              </button>
            </div>

            <div className="flex items-center gap-2 px-1 text-sm text-slate-500">
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

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {errorMessage ? (
                <p className="col-span-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : isLoading ? (
                <p className="col-span-full rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-black/5">
                  Carregando matérias...
                </p>
              ) : filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject: SubjectCardData) => <SubjectCard key={subject.title} {...subject} />)
              ) : (
                <p className="col-span-full rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-black/5">
                  Você ainda não possui matérias registradas.
                </p>
              )}

              <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h2 className="font-display text-4xl font-semibold leading-tight text-slate-900">
                  Adicionar mais matérias
                </h2>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 text-6xl font-light leading-none text-slate-800 transition hover:text-[#974FC9]"
                >
                  +
                </button>
              </article>
            </section>

            {isCreateOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                <div className="w-full max-w-xl rounded-3xl bg-[#f7f4fb] p-5 shadow-2xl ring-1 ring-white/60">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#974FC9]">Nova matéria</p>
                      <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900">
                        Criar uma matéria para estudar
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-black/5"
                    >
                      ×
                    </button>
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={handleCreateSubject}>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Nome da matéria</span>
                      <input
                        value={subjectName}
                        onChange={(event) => setSubjectName(event.target.value)}
                        required
                        placeholder="Ex: Biologia celular"
                        className="h-11 w-full rounded-2xl bg-white px-4 text-sm text-slate-800 outline-none ring-1 ring-black/5 placeholder:text-slate-400 focus:ring-[#974FC9]/45"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Descrição</span>
                      <textarea
                        value={subjectDescription}
                        onChange={(event) => setSubjectDescription(event.target.value)}
                        rows={3}
                        placeholder="Ex: Revisar organelas e respiração celular"
                        className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800 outline-none ring-1 ring-black/5 placeholder:text-slate-400 focus:ring-[#974FC9]/45"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Área</span>
                      <select
                        value={areaName}
                        onChange={(event) => setAreaName(event.target.value)}
                        className="h-11 w-full rounded-2xl bg-white px-4 text-sm text-slate-800 outline-none ring-1 ring-black/5 focus:ring-[#974FC9]/45"
                      >
                        {areaOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    {errorMessage ? (
                      <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                      </p>
                    ) : null}

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(false)}
                        className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-black/5"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-full bg-[#974FC9] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSaving ? "Salvando..." : "Adicionar matéria"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
