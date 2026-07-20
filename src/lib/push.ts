import webpush from "web-push";

import { prisma } from "@/lib/db";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export function isPushConfigured() {
  return Boolean(
    process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  );
}

let vapidReady = false;

function ensureVapid() {
  if (vapidReady) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidReady = true;
}

/**
 * Delivers a web-push notification to every registered device for a user.
 * Silently no-ops when push isn't configured and never throws, so any event
 * site (new lead, showing booked, etc.) can call it without extra branching —
 * mirrors the notifySlack convention.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    if (!isPushConfigured()) return;
    ensureVapid();

    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subscriptions.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
          }
        }
      }),
    );
  } catch {
    // Push failures must never break the calling request.
  }
}
