"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { discardOfflineEntry, getOfflineEntries, type OfflineEntry } from "@/lib/offline-store";

function entryInfo(entry: OfflineEntry) {
  if (entry.path.includes("/question-logs")) return { label: "Registro de questões", href: "/dashboard/analytics" as const };
  if (entry.path.includes("/availability")) return { label: "Horários de estudo", href: "/settings" as const };
  if (entry.path.includes("/difficulties")) return { label: "Dificuldades por matéria", href: "/settings" as const };
  if (entry.path.includes("/goal")) return { label: "Objetivo de estudo", href: "/settings" as const };
  if (entry.path.includes("/cycles")) return { label: "Alteração do ciclo", href: "/cycle" as const };
  return { label: "Alteração antiga", href: "/dashboard" as const };
}

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [entries, setEntries] = useState<OfflineEntry[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;
    const update = () => {
      setIsOnline(navigator.onLine);
      void getOfflineEntries().then((next) => { if (active) setEntries(next); }).catch(() => {
        // The connectivity notice still works when browser storage is blocked.
      });
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("focus", update);
    return () => {
      active = false;
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("focus", update);
    };
  }, []);

  useEffect(() => {
    if (reviewOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [reviewOpen]);

  async function discard(entry: OfflineEntry) {
    setIsDiscarding(true);
    setError("");
    try {
      await discardOfflineEntry(entry);
      setEntries((current) => current.filter((item) => item.id !== entry.id || item.store !== entry.store));
    } catch { setError("Não foi possível descartar este aviso. Tente novamente."); }
    setIsDiscarding(false);
  }

  if (isOnline && entries.length === 0 && !reviewOpen) return null;

  return <>
    <div role="status" className="fixed inset-x-3 bottom-24 z-50 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-lg lg:left-auto lg:max-w-sm">
      <p className="font-semibold">{isOnline ? "Alterações sem confirmação" : "Modo offline"}</p>
      <p className="mt-1 text-muted">{!isOnline ? "Sem conexão. O cronômetro continua na tela. Confira a sessão e tente salvar novamente quando a conexão voltar." : `${entries.length} aviso${entries.length > 1 ? "s" : ""} de alterações antigas neste navegador. Confira seus dados antes de repetir.`}</p>
      {entries.length > 0 ? <button type="button" onClick={() => setReviewOpen(true)} className="mt-2 min-h-11 font-semibold text-accent underline underline-offset-4">Conferir avisos ({entries.length})</button> : null}
    </div>
    <dialog ref={dialog} onClose={() => setReviewOpen(false)} aria-labelledby="offline-review-title" className="m-auto max-h-[85dvh] w-[calc(100%-2.5rem)] max-w-lg overflow-y-auto rounded-3xl border border-border bg-surface p-6 text-foreground shadow-xl backdrop:bg-black/50">
      <h2 id="offline-review-title" className="font-display text-2xl font-semibold">Alterações sem confirmação</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Confira seus dados antes de repetir uma alteração. Descartar remove apenas o aviso deste navegador e não altera sua conta.</p>
      <ul className="mt-5 space-y-3">{entries.map((entry) => {
        const info = entryInfo(entry);
        return <li key={`${entry.store}-${entry.id}`} className="rounded-2xl border border-border p-4">
          <p className="font-semibold">{info.label}</p>
          <p className="mt-1 text-sm text-muted">{entry.createdAt ? new Date(entry.createdAt).toLocaleString("pt-BR") : "Data não disponível"} · {entry.status === 401 ? "Acesso expirado" : entry.store === "conflicts" ? "Não foi possível confirmar" : "Resultado não confirmado"}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1"><Link href={info.href} onClick={() => setReviewOpen(false)} className="inline-flex min-h-11 items-center font-semibold text-accent">Conferir dados</Link><button type="button" disabled={isDiscarding} onClick={() => void discard(entry)} className="min-h-11 font-semibold text-muted disabled:opacity-50">Descartar aviso</button></div>
        </li>;
      })}</ul>
      {entries.length === 0 ? <p role="status" className="mt-5 text-muted">Todos os avisos foram descartados.</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      <button type="button" onClick={() => setReviewOpen(false)} className="mt-5 min-h-12 w-full rounded-full border border-border px-4 font-semibold">Fechar</button>
    </dialog>
  </>;
}
