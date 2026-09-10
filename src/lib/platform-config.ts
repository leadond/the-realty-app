export type ConfigStatus = {
  key: string;
  label: string;
  purpose: string;
  required: boolean;
  configured: boolean;
  secret: boolean;
  setupUrl?: string;
};

const has = (name: string) => Boolean(process.env[name]?.trim());

export function getPlatformConfig(): ConfigStatus[] {
  return [
    { key: "DATABASE_URL", label: "Database", purpose: "PostgreSQL data storage", required: true, configured: has("DATABASE_URL"), secret: true },
    { key: "NEXTAUTH_SECRET", label: "Authentication secret", purpose: "Signs login sessions and reset tokens", required: true, configured: has("NEXTAUTH_SECRET"), secret: true },
    { key: "NEXTAUTH_URL", label: "Application URL", purpose: "Canonical URL used by authentication callbacks", required: true, configured: has("NEXTAUTH_URL"), secret: false },
    { key: "GEMINI_API_KEY", label: "Gemini AI", purpose: "Powers assistant, matching, valuation, reports, and content tools", required: true, configured: has("GEMINI_API_KEY"), secret: true, setupUrl: "https://aistudio.google.com/apikey" },
    { key: "RESEND_API_KEY", label: "Resend email", purpose: "Password resets, campaigns, and automated email", required: false, configured: has("RESEND_API_KEY"), secret: true, setupUrl: "https://resend.com/api-keys" },
    { key: "STRIPE_SECRET_KEY", label: "Stripe billing", purpose: "Checkout and subscription management", required: false, configured: has("STRIPE_SECRET_KEY"), secret: true, setupUrl: "https://dashboard.stripe.com/apikeys" },
    { key: "STRIPE_PRICE_PRO", label: "Stripe Pro price", purpose: "Price used by the Pro checkout", required: false, configured: has("STRIPE_PRICE_PRO"), secret: false },
    { key: "STRIPE_PRICE_PROFESSIONAL", label: "Stripe Professional price", purpose: "Price used by the Professional checkout", required: false, configured: has("STRIPE_PRICE_PROFESSIONAL"), secret: false },
    { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook", purpose: "Verifies subscription lifecycle events", required: false, configured: has("STRIPE_WEBHOOK_SECRET"), secret: true },
    { key: "BRIDGE_SERVER_TOKEN", label: "Bridge server token", purpose: "Zillow Group datasets, listings, records, and market data", required: false, configured: has("BRIDGE_SERVER_TOKEN") || has("BRIDGE_ACCESS_TOKEN") || has("BRIDGE_API_TOKEN") || has("ZILLOW_SERVER_TOKEN"), secret: true, setupUrl: "https://bridgedataoutput.com/docs/platform/" },
    { key: "BLOB_READ_WRITE_TOKEN", label: "Vercel Blob", purpose: "Document and file storage", required: false, configured: has("BLOB_READ_WRITE_TOKEN"), secret: true },
    { key: "RESEND_FROM_EMAIL", label: "Verified sender", purpose: "From address for outbound email", required: false, configured: has("RESEND_FROM_EMAIL"), secret: false },
    { key: "CRON_SECRET", label: "Automation cron secret", purpose: "Authenticates scheduled automation runs", required: false, configured: has("CRON_SECRET"), secret: true },
    { key: "TWILIO_ACCOUNT_SID", label: "Twilio account", purpose: "SMS messaging account", required: false, configured: has("TWILIO_ACCOUNT_SID"), secret: false, setupUrl: "https://console.twilio.com" },
    { key: "TWILIO_AUTH_TOKEN", label: "Twilio auth token", purpose: "Authorizes SMS sending", required: false, configured: has("TWILIO_AUTH_TOKEN"), secret: true },
    { key: "TWILIO_PHONE_NUMBER", label: "Twilio phone number", purpose: "Outbound SMS caller ID", required: false, configured: has("TWILIO_PHONE_NUMBER"), secret: false },
    { key: "NEXT_PUBLIC_VAPID_PUBLIC_KEY", label: "Push public key", purpose: "Browser push notifications", required: false, configured: has("NEXT_PUBLIC_VAPID_PUBLIC_KEY"), secret: false },
    { key: "VAPID_PRIVATE_KEY", label: "Push private key", purpose: "Signs browser push notifications", required: false, configured: has("VAPID_PRIVATE_KEY"), secret: true },
    { key: "VAPID_SUBJECT", label: "Push subject", purpose: "Contact identity for push notifications", required: false, configured: has("VAPID_SUBJECT"), secret: false },
  ];
}

