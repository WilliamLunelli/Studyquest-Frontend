import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "studyquest_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  return secret;
}

function signUserId(userId: string) {
  return createHmac("sha256", getSessionSecret()).update(userId).digest("base64url");
}

export function createSessionToken(userId: string) {
  const encodedUserId = Buffer.from(userId, "utf8").toString("base64url");
  const signature = signUserId(userId);
  return `${encodedUserId}.${signature}`;
}

export function verifySessionToken(token: string) {
  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [encodedUserId, signature] = parts;

  if (!encodedUserId || !signature) {
    return null;
  }

  try {
    const userId = Buffer.from(encodedUserId, "base64url").toString("utf8");
    const expectedSignature = signUserId(userId);

    const left = Buffer.from(signature);
    const right = Buffer.from(expectedSignature);

    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}
