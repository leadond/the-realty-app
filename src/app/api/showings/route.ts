import { NextResponse } from "next/server";
import { ShowingStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ensureDemoWorkspace } from "@/lib/seed";

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : fallback;
}

export async function GET() {
  const user = await ensureDemoWorkspace();
  const showings = await prisma.showing.findMany({
    where: { userId: user.id },
    orderBy: { scheduledAt: "asc" },
    include: { property: true, lead: true },
  });

  return NextResponse.json({ ok: true, showings });
}

export async function POST(request: Request) {
  const user = await ensureDemoWorkspace();
  const body = await request.json();

  if (!body.scheduledAt || !body.propertyId) {
    return NextResponse.json(
      { ok: false, error: "scheduledAt and propertyId are required" },
      { status: 400 },
    );
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

  return NextResponse.json({ ok: true, showing }, { status: 201 });
}
