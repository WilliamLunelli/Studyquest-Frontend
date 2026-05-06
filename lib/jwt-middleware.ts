/**
 * Server-side JWT validation for protected routes
 */

import { NextRequest, NextResponse } from "next/server";

export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  
  return parts[1];
}

/**
 * Validate JWT token from Authorization header
 * In production, validate signature. For now, basic structure check.
 */
export function validateToken(token: string): boolean {
  if (!token) return false;
  
  const parts = token.split(".");
  return parts.length === 3;
}

/**
 * Middleware to check authentication on protected routes
 */
export function requireAuth(request: NextRequest) {
  const token = extractTokenFromRequest(request);
  
  if (!token || !validateToken(token)) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing token" },
      { status: 401 }
    );
  }
  
  return null; // Auth passed
}
