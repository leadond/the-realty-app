import twilio from "twilio";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function twimlResponse(status = 200) {
  return new Response(EMPTY_TWIML, {
    status,
    headers: { "content-type": "text/xml" },
  });
}

/**
 * Public endpoint Twilio calls on inbound SMS. Not covered by the middleware
 * matcher (lives outside /api/sms), so it's reachable without a session.
 * Trust is established by validating Twilio's request signature rather than
 * by getCurrentUser(). Always returns 2xx once past signature validation so
 * Twilio does not retry on business-logic no-ops.
 */
export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return twimlResponse(200);

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return new Response("Forbidden", { status: 403 });

  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") params[key] = value;
  }

  const isValid = twilio.validateRequest(authToken, signature, request.url, params);
  if (!isValid) return new Response("Forbidden", { status: 403 });

  const from = params.From;
  const to = params.To;
  const messageBody = params.Body ?? "";
  const twilioSid = params.MessageSid;

  if (!from || !to) return twimlResponse(200);

  const agentNumber = await prisma.agentPhoneNumber.findUnique({
    where: { phoneNumber: to },
    select: { userId: true },
  });
  if (!agentNumber) return twimlResponse(200);

  const lead = await prisma.lead.findFirst({
    where: { userId: agentNumber.userId, phone: from },
    select: { id: true },
  });
  if (!lead) return twimlResponse(200);

  await prisma.smsMessage.create({
    data: {
      userId: agentNumber.userId,
      leadId: lead.id,
      direction: "INBOUND",
      body: messageBody,
      fromNumber: from,
      toNumber: to,
      status: "RECEIVED",
      twilioSid: twilioSid ?? null,
    },
  });

  return twimlResponse(200);
}
