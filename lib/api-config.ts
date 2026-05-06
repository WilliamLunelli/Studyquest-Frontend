/**
 * API Configuration
 * Centralizes backend API endpoints and configuration
 */

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api",
  
  endpoints: {
    // Authentication
    login: "/users/login",
    register: "/users/register",
    me: "/users/me",
    
    // Records (Study Sessions)
    records: "/registros",
  },
  
  // HTTP Headers
  headers: {
    "Content-Type": "application/json",
  },
  
  // Token storage keys
  tokenKey: "studyquest_token",
  userKey: "studyquest_user",
};

/**
 * Build full URL for API endpoint
 */
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.baseUrl}${endpoint}`;
}

/**
 * Get stored JWT token from localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_CONFIG.tokenKey);
}

/**
 * Store JWT token in localStorage
 */
export function storeToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_CONFIG.tokenKey, token);
}

/**
 * Remove JWT token from localStorage
 */
export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_CONFIG.tokenKey);
  localStorage.removeItem(API_CONFIG.userKey);
}

/**
 * Get Authorization header with JWT token
 */
export function getAuthHeader(): { Authorization: string } | {} {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
