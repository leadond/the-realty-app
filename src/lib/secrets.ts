import crypto from "crypto";

import { prisma } from "@/lib/db";

/**
 * Admin-editable third-party API keys, stored encrypted in Postgres so the
 * Backend Admin UI can set them at runtime — Vercel env vars can't be
 * changed without a redeploy. Foundational config (DATABASE_URL,
 * NEXTAUTH_SECRET/URL, NEXT_PUBLIC_* build-time vars) is intentionally NOT
 * managed here: DATABASE_URL is needed before this module can even reach
 * the DB, NEXTAUTH_SECRET both signs sessions and derives the encryption
 * key below (rotating it here would be circular), and NEXT_PUBLIC_* vars
 * are inlined into the client bundle at build time so a DB value could
 * never reach it anyway.
 */
export const MANAGED_SECRET_KEYS = [
  "GEMINI_API_KEY",
  "ANTHROPIC_API_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_PRO",
  "STRIPE_PRICE_PROFESSIONAL",
  "STRIPE_WEBHOOK_SECRET",
  "BRIDGE_SERVER_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
  "CRON_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
] as const;

export type ManagedSecretKey = (typeof MANAGED_SECRET_KEYS)[number];

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET must be set to store platform secrets");
  return crypto.scryptSync(secret, "platform-secret-store", 32);
}

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(".");
}

function decrypt(stored: string): string | null {
  try {
    const [ivB64, authTagB64, ciphertextB64] = stored.split(".");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, "base64")), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    return null;
  }
}

// Short-lived in-memory cache so a warm serverless instance doesn't hit the
// DB on every single getSecret() call within the same request burst.
const cache = new Map<string, { value: string | null; expiresAt: number }>();
const CACHE_TTL_MS = 30_000;

/** Reads a managed secret: DB value if the admin has set one, else the env var, else null. */
export async function getSecret(key: ManagedSecretKey): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const row = await prisma.platformSecret.findUnique({ where: { key } });
  const value = row ? decrypt(row.valueEnc) : (process.env[key]?.trim() || null);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function setSecret(key: ManagedSecretKey, value: string, updatedBy: string): Promise<void> {
  await prisma.platformSecret.upsert({
    where: { key },
    create: { key, valueEnc: encrypt(value), updatedBy },
    update: { valueEnc: encrypt(value), updatedBy },
  });
  cache.delete(key);
}

export async function clearSecret(key: ManagedSecretKey): Promise<void> {
  await prisma.platformSecret.deleteMany({ where: { key } });
  cache.delete(key);
}

/** Which managed keys have a DB-stored override vs. falling back to env vars. Never returns values. */
export async function listSecretOverrides(): Promise<Record<string, { updatedAt: Date; updatedBy: string | null }>> {
  const rows = await prisma.platformSecret.findMany({ select: { key: true, updatedAt: true, updatedBy: true } });
  return Object.fromEntries(rows.map((r) => [r.key, { updatedAt: r.updatedAt, updatedBy: r.updatedBy }]));
}

let hydratedAt = 0;
const HYDRATE_INTERVAL_MS = 30_000;

/**
 * Writes every DB-stored managed secret into process.env for this warm
 * server instance, so the existing sync `isXConfigured()`/`getXClient()`
 * helpers throughout the codebase (Stripe, Bridge, Twilio, Blob, ...) pick
 * up admin-entered values without every call site needing to become async.
 * Cheap to call often — re-hydrates at most once per 30s per instance.
 * Call this as early as possible on any request path that might read a
 * managed secret; getCurrentUser() calls it, which covers the whole
 * authenticated app. The one public/unauthenticated path that reads a
 * managed secret (the Stripe webhook) calls getSecret() directly instead.
 */
export async function hydrateEnvFromDb(): Promise<void> {
  if (Date.now() - hydratedAt < HYDRATE_INTERVAL_MS) return;
  hydratedAt = Date.now();
  try {
    const rows = await prisma.platformSecret.findMany();
    for (const row of rows) {
      const value = decrypt(row.valueEnc);
      if (value !== null) process.env[row.key] = value;
    }
  } catch {
    // Never let secret hydration break a request — worst case, admin-set
    // overrides aren't picked up yet and env vars (if any) still apply.
  }
}
