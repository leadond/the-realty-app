import crypto from "crypto";

import { prisma } from "@/lib/db";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function getResetSecret() {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required for password reset tokens.");
  }
  return "local-password-reset-secret";
}

function signTokenPayload(userId: string, passwordHash: string, expiresAt: number) {
  return crypto
    .createHmac("sha256", getResetSecret())
    .update(`${userId}.${passwordHash}.${expiresAt}`)
    .digest("base64url");
}

export function createPasswordResetToken(userId: string, passwordHash: string) {
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
  const signature = signTokenPayload(userId, passwordHash, expiresAt);
  return `${userId}.${expiresAt}.${signature}`;
}

export async function verifyPasswordResetToken(token: string) {
  const [userId, expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (!userId || !expiresAtRaw || !signature || !Number.isFinite(expiresAt)) {
    return null;
  }
  if (Date.now() > expiresAt) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });
  if (!user?.password) return null;

  const expected = signTokenPayload(user.id, user.password, expiresAt);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer) ? user : null;
}
