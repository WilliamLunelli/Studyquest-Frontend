/**
 * JWT Authentication Handler
 * Manages JWT tokens received from backend
 * Stores in localStorage and provides Authorization headers
 */

import { API_CONFIG } from "@/lib/api-config";

export interface User {
  id: string;
  nome: string;
  email: string;
  onboardingCompleto: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Get current stored user
 */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem(API_CONFIG.userKey);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Save JWT token and user after successful login
 */
export function saveAuth(response: AuthResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_CONFIG.tokenKey, response.token);
  localStorage.setItem(API_CONFIG.userKey, JSON.stringify(response.user));
}

/**
 * Clear authentication (logout)
 */
export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_CONFIG.tokenKey);
  localStorage.removeItem(API_CONFIG.userKey);
}
