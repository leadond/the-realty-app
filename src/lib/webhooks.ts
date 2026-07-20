import { createHmac } from "crypto";

import { prisma } from "@/lib/db";

/**
 * Dispatches an event to every active webhook endpoint the user has subscribed
 * to for that event. Mirrors notifySlack's convention: failures are swallowed
 * so a broken or slow receiver can never break the calling request. Each
 * endpoint POST is isolated so one failure doesn't stop delivery to the rest.
 *
 * The raw JSON body is signed with HMAC-SHA256 using the endpoint's own secret
 * and sent as an X-Webhook-Signature header (hex digest) so receivers can
 * verify authenticity — the same scheme used by Stripe, GitHub, etc.
 */
export async function dispatchWebhookEvent(
  userId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { userId, isActive: true },
    });

    const subscribed = endpoints.filter((endpoint) =>
      endpoint.events
        .split(",")
        .map((name) => name.trim())
        .includes(event),
    );
    if (subscribed.length === 0) return;

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    await Promise.all(
      subscribed.map(async (endpoint) => {
        try {
          const signature = createHmac("sha256", endpoint.secret).update(body).digest("hex");
          await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-webhook-signature": signature,
            },
            body,
            signal: AbortSignal.timeout(5000),
          });
        } catch {
          // A single failing endpoint must not stop delivery to the others.
        }
      }),
    );
  } catch {
    // Webhook delivery must never break the calling request.
  }
}
