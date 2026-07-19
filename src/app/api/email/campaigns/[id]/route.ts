import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveSegment } from "@/lib/email/segment";
import { isEmailConfigured, renderPlaceholders, sendEmail, textToHtml } from "@/lib/email/resend";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id, userId: user.id },
    include: { sends: true },
  });
  if (!campaign) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, campaign });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const campaign = await prisma.emailCampaign.findFirst({ where: { id, userId: user.id } });
  if (!campaign) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = await request.json();

  if (body.action !== "send") {
    const updated = await prisma.emailCampaign.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name) : undefined,
        subject: body.subject !== undefined ? String(body.subject) : undefined,
        body: body.body !== undefined ? String(body.body) : undefined,
      },
    });
    return NextResponse.json({ ok: true, campaign: updated });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Email sending is not configured. Add a RESEND_API_KEY environment variable in Vercel and redeploy." },
      { status: 503 },
    );
  }
  if (campaign.status === "SENT" || campaign.status === "SENDING") {
    return NextResponse.json({ ok: false, error: "This campaign has already been sent" }, { status: 409 });
  }

  const recipients = await prisma.lead.findMany({
    where: resolveSegment(user.id, campaign.segment),
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (recipients.length === 0) {
    return NextResponse.json({ ok: false, error: "No leads match this campaign's segment" }, { status: 400 });
  }

  await prisma.emailCampaign.update({ where: { id }, data: { status: "SENDING" } });

  let sentCount = 0;
  let failedCount = 0;

  for (const lead of recipients) {
    if (!lead.email) continue;
    const personalized = renderPlaceholders(campaign.body, {
      first_name: lead.firstName,
      last_name: lead.lastName,
      client_name: `${lead.firstName} ${lead.lastName}`,
    });
    const result = await sendEmail(lead.email, campaign.subject, textToHtml(personalized));

    await prisma.emailSend.create({
      data: {
        campaignId: campaign.id,
        leadId: lead.id,
        recipientEmail: lead.email,
        status: result.ok ? "SENT" : "FAILED",
        providerMessageId: result.ok ? result.id : null,
        errorMessage: result.ok ? null : result.error,
        sentAt: result.ok ? new Date() : null,
      },
    });

    if (result.ok) sentCount++;
    else failedCount++;
  }

  const finalCampaign = await prisma.emailCampaign.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date() },
    include: { sends: true },
  });

  return NextResponse.json({ ok: true, campaign: finalCampaign, sentCount, failedCount });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const owned = await prisma.emailCampaign.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.emailCampaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
