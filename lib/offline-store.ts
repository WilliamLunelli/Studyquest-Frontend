type StoreName = "outbox" | "conflicts";

export type OfflineEntry = {
  id: number;
  store: StoreName;
  path: string;
  createdAt: number;
  status?: number;
};

type LegacyEntry = Record<string, unknown> & { id: number };
const DB_NAME = "studyquest-offline";
const DB_VERSION = 1;
const stores: StoreName[] = ["outbox", "conflicts"];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of stores) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Keep only a review notice, without credentials or a request that could be replayed. */
export function legacyEntryNotice(entry: LegacyEntry, store: StoreName): OfflineEntry {
  let path = "/";
  try { path = new URL(String(entry.url ?? ""), "https://studyquest.invalid").pathname; } catch {}
  return {
    id: entry.id,
    store,
    path,
    createdAt: typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt) ? entry.createdAt : 0,
    ...(typeof entry.status === "number" ? { status: entry.status } : {}),
  };
}

export async function getOfflineEntries(): Promise<OfflineEntry[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const entries: OfflineEntry[] = [];
    const transaction = db.transaction(stores, "readwrite");
    for (const name of stores) {
      const store = transaction.objectStore(name);
      const request = store.getAll();
      request.onsuccess = () => {
        for (const raw of request.result as LegacyEntry[]) {
          const entry = legacyEntryNotice(raw, name);
          entries.push(entry);
          // Replace old headers/bodies/tokens, preserving the original store and key.
          store.put({ id: entry.id, url: entry.path, createdAt: entry.createdAt, status: entry.status, reviewRequired: true });
        }
      };
    }
    transaction.oncomplete = () => { db.close(); resolve(entries.sort((a, b) => b.createdAt - a.createdAt)); };
    transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export async function discardOfflineEntry(entry: Pick<OfflineEntry, "id" | "store">) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(entry.store, "readwrite");
    transaction.objectStore(entry.store).delete(entry.id);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}
