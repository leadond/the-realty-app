import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import { resolveSegment } from "@/lib/email/segment";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "email-campaigns");
  if (denied) return denied;

  const campaigns = await prisma.emailCampaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sends: true } } },
  });

  return NextResponse.json({ ok: true, campaigns });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "email-campaigns");
  if (denied) return denied;

  const body = await request.json();
  if (!body.name || !body.subject || !body.body) {
    return NextResponse.json({ ok: false, error: "name, subject, and body are required" }, { status: 400 });
  }

  const segment = JSON.stringify(body.segment || {});
  const recipientCount = await prisma.lead.count({ where: resolveSegment(user.id, segment) });

  const campaign = await prisma.emailCampaign.create({
    data: {
      userId: user.id,
      templateId: body.templateId ? String(body.templateId) : null,
      name: String(body.name),
      subject: String(body.subject),
      body: String(body.body),
      segment,
      status: "DRAFT",
    },
  });

  return NextResponse.json({ ok: true, campaign, recipientCount }, { status: 201 });
}
