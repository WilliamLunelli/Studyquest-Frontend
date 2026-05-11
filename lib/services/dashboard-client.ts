import { type DashboardPayload, mapDashboardPayload } from "@/lib/frontend/dashboard";
import { getAuthHeader } from "@/lib/api-config";

type DashboardApiError = { message: string };

type DashboardClientResult =
  | { status: "ok"; data: DashboardPayload }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

export async function fetchDashboardClient(): Promise<DashboardClientResult> {
  try {
    const authHeader = getAuthHeader();

    const response = await fetch("/api/dashboard", {
      credentials: "include",
      headers: {
        ...authHeader,
      },
    });

    if (response.status === 401) {
      return { status: "unauthorized" };
    }

    const payload = (await response.json()) as DashboardPayload | DashboardApiError;

    if (!response.ok) {
      const message = "message" in payload ? payload.message : "Não foi possível carregar o dashboard.";
      return { status: "error", message };
    }

    const mapped = mapDashboardPayload(payload as DashboardPayload);
    return { status: "ok", data: mapped };
  } catch {
    return { status: "error", message: "Erro ao carregar dashboard. Tente novamente." };
  }
}
