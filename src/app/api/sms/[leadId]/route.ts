import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import { isSmsConfigured, sendSms } from "@/lib/sms/twilio";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ leadId: string }> };

/** Full message thread for one lead, oldest-first. */
export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "sms-messaging");
  if (denied) return denied;

  const { leadId } = await context.params;
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: user.id },
    select: { id: true, firstName: true, lastName: true, phone: true },
  });
  if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });

  const messages = await prisma.smsMessage.findMany({
    where: { leadId, userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, lead, messages });
}

/** Sends a new outbound message to this lead. */
export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "sms-messaging");
  if (denied) return denied;

  if (!isSmsConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SMS isn't configured — add TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER and provision an AgentPhoneNumber.",
      },
      { status: 503 },
    );
  }

  const { leadId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body : "";
  if (!text.trim()) {
    return NextResponse.json({ ok: false, error: "Message body is required" }, { status: 400 });
  }

  const result = await sendSms(user.id, leadId, text);
  if (!result.ok) {
    const status = result.error === "Lead not found." ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, message: result.message }, { status: 201 });
}
