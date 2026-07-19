import { NextResponse } from "next/server";
import { InterestLevel } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ensureDemoWorkspace } from "@/lib/seed";

type RouteContext = { params: Promise<{ id: string }> };

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : fallback;
}

export async function POST(request: Request, context: RouteContext) {
  await ensureDemoWorkspace();
  const { id } = await context.params;
  const body = await request.json();

  if (!body.firstName || !body.lastName) {
    return NextResponse.json({ ok: false, error: "firstName and lastName required" }, { status: 400 });
  }

  const visitor = await prisma.visitor.create({
    data: {
      openHouseId: id,
      firstName: String(body.firstName),
      lastName: String(body.lastName),
      email: body.email ? String(body.email) : null,
      phone: body.phone ? String(body.phone) : null,
      isRegistered: Boolean(body.isRegistered),
      interestLevel: parseEnum(InterestLevel, body.interestLevel, InterestLevel.NEUTRAL),
      notes: body.notes ? String(body.notes) : null,
      followUpNeeded: Boolean(body.followUpNeeded),
    },
  });

  return NextResponse.json({ ok: true, visitor }, { status: 201 });
}
