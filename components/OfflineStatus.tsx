"use client";

import { useEffect, useState } from "react";
import { getOfflineCounts } from "@/lib/offline-store";

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [conflicts, setConflicts] = useState(0);

  useEffect(() => {
    const update = () => {
      setIsOnline(navigator.onLine);
      void getOfflineCounts().then(({ pending: nextPending, conflicts: nextConflicts }) => {
        setPending(nextPending);
        setConflicts(nextConflicts);
      });
    };

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    navigator.serviceWorker?.addEventListener("message", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      navigator.serviceWorker?.removeEventListener("message", update);
    };
  }, []);

  if (isOnline && pending === 0 && conflicts === 0) return null;

  const message = !isOnline
    ? "Sem conexao. O cronometro continua funcionando e as alteracoes ficam salvas neste aparelho."
    : conflicts > 0
      ? `${conflicts} conflito${conflicts > 1 ? "s" : ""} aguardando revisao.`
      : `Sincronizando ${pending} alteracao${pending > 1 ? "es" : ""}...`;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-lg lg:bottom-4 lg:left-auto lg:max-w-sm">
      <p className="font-semibold">{isOnline ? "Sincronizacao" : "Modo offline"}</p>
      <p className="mt-1 text-muted">{message}</p>
    </div>
  );
}