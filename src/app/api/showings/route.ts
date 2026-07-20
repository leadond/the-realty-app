import { NextResponse } from "next/server";
import { ShowingStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { notifySlack } from "@/lib/integrations/slack";
import { dispatchWebhookEvent } from "@/lib/webhooks";

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : fallback;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const showings = await prisma.showing.findMany({
    where: { userId: user.id },
    orderBy: { scheduledAt: "asc" },
    include: { property: true, lead: true },
  });

  return NextResponse.json({ ok: true, showings });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.scheduledAt || !body.propertyId) {
    return NextResponse.json(
      { ok: false, error: "scheduledAt and propertyId are required" },
      { status: 400 },
    );
  }

  const property = await prisma.property.findFirst({
    where: { id: String(body.propertyId), userId: user.id },
    select: { id: true },
  });
  if (!property) {
    return NextResponse.json({ ok: false, error: "Property not found" }, { status: 400 });
  }

  const showing = await prisma.showing.create({
    data: {
      userId: user.id,
      propertyId: String(body.propertyId),
      leadId: body.leadId ? String(body.leadId) : null,
      scheduledAt: new Date(body.scheduledAt),
      status: parseEnum(ShowingStatus, body.status, ShowingStatus.SCHEDULED),
      durationMin: body.durationMin ? Number(body.durationMin) : 30,
      notes: body.notes ? String(body.notes) : null,
    },
  });

  await notifySlack(user.id, `📅 Showing scheduled for *${new Date(showing.scheduledAt).toLocaleString()}*`);
  await dispatchWebhookEvent(user.id, "showing.scheduled", { showingId: showing.id, propertyId: showing.propertyId, leadId: showing.leadId, scheduledAt: showing.scheduledAt.toISOString() });

  return NextResponse.json({ ok: true, showing }, { status: 201 });
}
