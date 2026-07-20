import { NextResponse } from "next/server";
import { InterestLevel } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";

type RouteContext = { params: Promise<{ id: string }> };

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : fallback;
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "open-houses");
  if (denied) return denied;

  const { id } = await context.params;
  const owned = await prisma.openHouse.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Open house not found" }, { status: 404 });

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
      signedInAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, visitor }, { status: 201 });
}
