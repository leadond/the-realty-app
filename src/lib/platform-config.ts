import { listSecretOverrides, MANAGED_SECRET_KEYS, type ManagedSecretKey } from "@/lib/secrets";

export type ConfigStatus = {
  key: string;
  label: string;
  purpose: string;
  required: boolean;
  configured: boolean;
  secret: boolean;
  managed: boolean;
  setupUrl?: string;
};

type ConfigDef = {
  key: string;
  label: string;
  purpose: string;
  required: boolean;
  secret: boolean;
  setupUrl?: string;
  /** Extra env var names that also satisfy this item (aliases), checked in addition to `key`. */
  aliases?: string[];
};

const definitions: ConfigDef[] = [
  { key: "DATABASE_URL", label: "Database", purpose: "PostgreSQL data storage", required: true, secret: true },
  { key: "NEXTAUTH_SECRET", label: "Authentication secret", purpose: "Signs login sessions and reset tokens", required: true, secret: true },
  { key: "NEXTAUTH_URL", label: "Application URL", purpose: "Canonical URL used by authentication callbacks", required: true, secret: false },
  { key: "GEMINI_API_KEY", label: "Gemini AI", purpose: "Powers assistant, matching, valuation, reports, and content tools", required: true, secret: true, setupUrl: "https://aistudio.google.com/apikey" },
  { key: "ANTHROPIC_API_KEY", label: "Anthropic Claude", purpose: "Fallback AI provider if Gemini errors or isn't configured", required: false, secret: true, setupUrl: "https://console.anthropic.com/settings/keys" },
  { key: "RESEND_API_KEY", label: "Resend email", purpose: "Password resets, campaigns, and automated email", required: false, secret: true, setupUrl: "https://resend.com/api-keys" },
  { key: "STRIPE_SECRET_KEY", label: "Stripe billing", purpose: "Checkout and subscription management", required: false, secret: true, setupUrl: "https://dashboard.stripe.com/apikeys" },
  { key: "STRIPE_PRICE_PRO", label: "Stripe Pro price", purpose: "Price used by the Pro checkout", required: false, secret: false },
  { key: "STRIPE_PRICE_PROFESSIONAL", label: "Stripe Professional price", purpose: "Price used by the Professional checkout", required: false, secret: false },
  { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook", purpose: "Verifies subscription lifecycle events", required: false, secret: true },
  { key: "BRIDGE_SERVER_TOKEN", label: "Bridge server token", purpose: "Zillow Group datasets, listings, records, and market data", required: false, secret: true, setupUrl: "https://bridgedataoutput.com/docs/platform/", aliases: ["BRIDGE_ACCESS_TOKEN", "BRIDGE_API_TOKEN", "ZILLOW_SERVER_TOKEN"] },
  { key: "BLOB_READ_WRITE_TOKEN", label: "Vercel Blob", purpose: "Document and file storage", required: false, secret: true },
  { key: "RESEND_FROM_EMAIL", label: "Verified sender", purpose: "From address for outbound email", required: false, secret: false },
  { key: "CRON_SECRET", label: "Automation cron secret", purpose: "Authenticates scheduled automation runs. Note: Vercel Cron sends whatever value is set in the Vercel project's own CRON_SECRET env var — update it there too, or scheduled runs will fail to authenticate.", required: false, secret: true },
  { key: "TWILIO_ACCOUNT_SID", label: "Twilio account", purpose: "SMS messaging account", required: false, secret: false, setupUrl: "https://console.twilio.com" },
  { key: "TWILIO_AUTH_TOKEN", label: "Twilio auth token", purpose: "Authorizes SMS sending", required: false, secret: true },
  { key: "TWILIO_PHONE_NUMBER", label: "Twilio phone number", purpose: "Outbound SMS caller ID", required: false, secret: false },
  { key: "NEXT_PUBLIC_VAPID_PUBLIC_KEY", label: "Push public key", purpose: "Browser push notifications", required: false, secret: false },
  { key: "VAPID_PRIVATE_KEY", label: "Push private key", purpose: "Signs browser push notifications", required: false, secret: true },
  { key: "VAPID_SUBJECT", label: "Push subject", purpose: "Contact identity for push notifications", required: false, secret: false },
];

function isManaged(key: string): key is ManagedSecretKey {
  return (MANAGED_SECRET_KEYS as readonly string[]).includes(key);
}

export async function getPlatformConfig(): Promise<ConfigStatus[]> {
  // Reads DB overrides fresh (no cache) so a just-saved key shows as
  // Configured immediately — this page only needs presence, never the
  // decrypted value, so there's no reason to go through getSecret()'s cache.
  const overrides = await listSecretOverrides();

  return definitions.map((item) => {
    const managed = isManaged(item.key);
    const hasOverride = managed && Boolean(overrides[item.key]);
    const envValue = process.env[item.key]?.trim();
    const aliasHit = !envValue && item.aliases ? item.aliases.some((a) => Boolean(process.env[a]?.trim())) : false;
    return {
      key: item.key,
      label: item.label,
      purpose: item.purpose,
      required: item.required,
      secret: item.secret,
      managed,
      configured: hasOverride || Boolean(envValue) || aliasHit,
      setupUrl: item.setupUrl,
    };
  });
}
