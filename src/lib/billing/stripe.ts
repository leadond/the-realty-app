import Stripe from "stripe";

export function isBillingConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;

/** Lazily constructs the Stripe client so the app doesn't crash at import time when the key isn't set. */
export function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

export const PLAN_PRICE_ENV: Record<string, string> = {
  pro: "STRIPE_PRICE_PRO",
  professional: "STRIPE_PRICE_PROFESSIONAL",
};

export function getPriceId(plan: string): string | null {
  const envKey = PLAN_PRICE_ENV[plan];
  return envKey ? process.env[envKey] || null : null;
}
