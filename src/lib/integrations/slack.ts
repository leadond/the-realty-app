import { prisma } from "@/lib/db";

/**
 * Sends a message to the user's connected Slack Incoming Webhook, if any.
 * Silently no-ops if Slack isn't connected — callers don't need to check
 * first, keeping this safe to call from any event site (new lead, showing
 * scheduled, contract signed, etc.) without extra branching.
 */
export async function notifySlack(userId: string, text: string) {
  try {
    const connection = await prisma.userAppConnection.findFirst({
      where: { userId, isActive: true, webhookUrl: { not: null }, integration: { name: "slack" } },
    });
    if (!connection?.webhookUrl) return;

    await fetch(connection.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // Notification failures should never break the calling request.
  }
}
