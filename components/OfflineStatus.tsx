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
      }).catch(() => { /* Connectivity notice works even when IndexedDB is unavailable. */ });
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
    ? "Sem conexão. O cronômetro continua na tela. Confira a sessão e tente salvar novamente quando a conexão voltar."
    : conflicts > 0
      ? `${conflicts} conflito${conflicts > 1 ? "s" : ""} aguardando revisao.`
      : `${pending} alteração${pending > 1 ? "es" : ""} pendente${pending > 1 ? "s" : ""}. Confira seus dados após a conexão voltar.`;

  return (
    <div role="status" className="fixed inset-x-3 bottom-24 z-50 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-lg lg:left-auto lg:max-w-sm">
      <p className="font-semibold">{isOnline ? "Sincronizacao" : "Modo offline"}</p>
      <p className="mt-1 text-muted">{message}</p>
    </div>
  );
}
