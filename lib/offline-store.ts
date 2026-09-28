export type OfflineMutation = {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  createdAt: number;
  attempts: number;
};

const DB_NAME = "studyquest-offline";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("conflicts")) db.createObjectStore("conflicts", { keyPath: "id", autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAll<T>(storeName: "outbox" | "conflicts"): Promise<T[]> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function getOfflineCounts() {
  if (typeof indexedDB === "undefined") return { pending: 0, conflicts: 0 };
  const [pending, conflicts] = await Promise.all([
    getAll<OfflineMutation>("outbox"),
    getAll<{ id: number }>("conflicts"),
  ]);
  return { pending: pending.length, conflicts: conflicts.length };
}