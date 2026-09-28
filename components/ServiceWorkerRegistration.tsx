"use client";

import { useEffect } from "react";

type SyncRegistration = ServiceWorkerRegistration & {
  sync?: { register(tag: string): Promise<void> };
};

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cleanup: (() => void) | undefined;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      void navigator.serviceWorker.ready.then((readyRegistration) => {
        const syncRegistration = readyRegistration as SyncRegistration;
        const requestSync = async () => {
          if (syncRegistration.sync) {
            try {
              await syncRegistration.sync.register("studyquest-outbox");
              return;
            } catch {
            }
          }
          readyRegistration.active?.postMessage({ type: "SYNC_OUTBOX" });
        };

        window.addEventListener("online", requestSync);
        void requestSync();
        cleanup = () => window.removeEventListener("online", requestSync);
      });
    });

    return () => cleanup?.();
  }, []);

  return null;
}