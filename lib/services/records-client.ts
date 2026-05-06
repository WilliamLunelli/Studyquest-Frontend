/**
 * Records Client
 * Fetches study sessions from backend /api/registros
 */

import { buildApiUrl, getAuthHeader, API_CONFIG } from "@/lib/api-config";

export interface StudySession {
  id: string;
  userId: string;
  subjectId: string;
  studyTime: number;
  questions: number;
  rate: number;
  createdAt: string;
}

export interface RecordsResponse {
  sessions: StudySession[];
}

export type RecordsResult =
  | { status: "ok"; data: StudySession[] }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

/**
 * Fetch study sessions from backend
 * Requires valid JWT in Authorization header
 */
export async function fetchRecordsFromBackend(): Promise<RecordsResult> {
  try {
    const backendUrl = buildApiUrl(API_CONFIG.endpoints.records);
    const authHeader = getAuthHeader();

    if (!Object.keys(authHeader).length) {
      return { status: "unauthorized" };
    }

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        ...API_CONFIG.headers,
        ...authHeader,
      },
    });

    if (response.status === 401) {
      return { status: "unauthorized" };
    }

    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      return {
        status: "error",
        message: error.message ?? "Erro ao carregar registros.",
      };
    }

    const data = (await response.json()) as RecordsResponse;
    return { status: "ok", data: data.sessions };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao conectar com backend.";
    return { status: "error", message };
  }
}
