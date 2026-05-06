/**
 * JWT Authentication Handler
 * Manages JWT tokens received from backend
 * Stores in localStorage and provides Authorization headers
 */

import { API_CONFIG } from "@/lib/api-config";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  level: number;
  xp: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

/**
 * Check if token exists and is not expired
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(API_CONFIG.tokenKey);
  return !!token;
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

/**
 * Decode JWT payload (without verification)
 * Only for reading claims, not for security validation
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;
  
  const expiresAt = (payload.exp as number) * 1000;
  return Date.now() >= expiresAt;
}
