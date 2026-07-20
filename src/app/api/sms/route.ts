import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

/** Lists leads that have SMS activity, most recently active first (thread list for the inbox). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "sms-messaging");
  if (denied) return denied;

  const messages = await prisma.smsMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { lead: { select: { id: true, firstName: true, lastName: true, phone: true } } },
  });

  const threadsByLead = new Map<
    string,
    {
      leadId: string;
      lead: { id: string; firstName: string; lastName: string; phone: string | null };
      lastMessage: { body: string; direction: string; status: string; createdAt: Date };
    }
  >();

  for (const message of messages) {
    if (threadsByLead.has(message.leadId)) continue;
    threadsByLead.set(message.leadId, {
      leadId: message.leadId,
      lead: message.lead,
      lastMessage: {
        body: message.body,
        direction: message.direction,
        status: message.status,
        createdAt: message.createdAt,
      },
    });
  }

  return NextResponse.json({ ok: true, threads: Array.from(threadsByLead.values()) });
}
