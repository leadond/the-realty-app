const RESEND_URL = "https://api.resend.com/emails";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Sends a single email via Resend. Requires RESEND_API_KEY and, for
 * production sending beyond the sandbox address, a verified sending
 * domain configured with RESEND_FROM_EMAIL. Returns a result object
 * instead of throwing so bulk sends can continue past individual failures.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "EMAIL_NOT_CONFIGURED" };
  }

  const from = process.env.RESEND_FROM_EMAIL || "The Realty App <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.message || `Resend API error (${res.status})` };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send email" };
  }
}

export function renderPlaceholders(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match);
}

export function textToHtml(text: string) {
  return text
    .split("\n")
    .map((line) => (line.trim() === "" ? "<br/>" : `<p style="margin:0 0 12px;line-height:1.5;">${escapeHtml(line)}</p>`))
    .join("\n");
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
