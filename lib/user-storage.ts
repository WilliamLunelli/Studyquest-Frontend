import { getCurrentUser } from "@/lib/jwt-auth";

export function userStorageKey(name: string) {
  const id = getCurrentUser()?.id;
  return id ? `studyquest_${name}:${id}` : null;
}

export function readUserStorage<T>(name: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const key = userStorageKey(name);
    const value = key ? localStorage.getItem(key) : null;
    return value ? JSON.parse(value) as T : null;
  } catch { return null; }
}

export function writeUserStorage(name: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    const key = userStorageKey(name);
    if (key) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    }
  } catch { /* Server writes remain valid when browser storage is unavailable. */ }
}
