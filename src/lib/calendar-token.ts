import { createHmac, timingSafeEqual } from "crypto";

function computeToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return createHmac("sha256", secret).update(userId).digest("hex");
}

/**
 * Deterministic per-user calendar feed token. Derived from NEXTAUTH_SECRET so
 * it needs no DB storage and can be recomputed for verification. Anyone with
 * the token can read the user's calendar feed, so the URL is treated as a
 * secret (like a webhook signing key).
 */
export function generateCalendarToken(userId: string): string {
  return computeToken(userId);
}

export function verifyCalendarToken(userId: string, token: string): boolean {
  if (!token) return false;
  const expected = computeToken(userId);
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(token, "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
