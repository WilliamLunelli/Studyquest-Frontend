import { proxyAuthRequest } from "@/app/api/auth/proxy";
import { API_CONFIG } from "@/lib/api-config";

export async function POST(request: Request) {
  return proxyAuthRequest(request, API_CONFIG.endpoints.register);
}
