import twilio from "twilio";
import type { SmsMessage } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * SMS is "configured" when the platform Twilio credentials are present in the
 * environment. The per-user requirement — the sending agent must have an
 * AgentPhoneNumber row to text FROM — is enforced separately inside sendSms,
 * because it depends on the user and must degrade gracefully at call time
 * rather than gate the whole feature at the environment level.
 */
export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

let client: ReturnType<typeof twilio> | null = null;

/** Lazily constructs the Twilio client so the app doesn't crash at import time when creds aren't set. */
export function getTwilioClient(): ReturnType<typeof twilio> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error("SMS_NOT_CONFIGURED");
  }
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export type SendSmsResult =
  | { ok: true; message: SmsMessage }
  | { ok: false; error: string };

/**
 * Sends an outbound SMS to a lead. Records a PENDING SmsMessage row first, then
 * updates it to SENT/FAILED based on the Twilio result. Never throws — returns
 * a result object so callers (API routes) can respond cleanly.
 */
export async function sendSms(userId: string, leadId: string, body: string): Promise<SendSmsResult> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Message body is required." };

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
    select: { id: true, phone: true },
  });
  if (!lead) return { ok: false, error: "Lead not found." };
  if (!lead.phone) return { ok: false, error: "This lead has no phone number on file." };

  const agentNumber = await prisma.agentPhoneNumber.findUnique({
    where: { userId },
    select: { phoneNumber: true },
  });
  if (!agentNumber) {
    return { ok: false, error: "No SMS number configured — contact support to provision one." };
  }

  const message = await prisma.smsMessage.create({
    data: {
      userId,
      leadId,
      direction: "OUTBOUND",
      body: trimmed,
      fromNumber: agentNumber.phoneNumber,
      toNumber: lead.phone,
      status: "PENDING",
    },
  });

  try {
    const sent = await getTwilioClient().messages.create({
      body: trimmed,
      from: agentNumber.phoneNumber,
      to: lead.phone,
    });

    const updated = await prisma.smsMessage.update({
      where: { id: message.id },
      data: { status: "SENT", twilioSid: sent.sid },
    });
    return { ok: true, message: updated };
  } catch (error) {
    await prisma.smsMessage.update({
      where: { id: message.id },
      data: { status: "FAILED" },
    });
    console.error("Failed to send SMS", {
      userId,
      leadId,
      messageId: message.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, error: "Failed to send message. Please try again." };
  }
}
