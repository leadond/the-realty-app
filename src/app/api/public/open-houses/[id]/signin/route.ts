import { NextResponse } from "next/server";
import { InterestLevel } from "@prisma/client";

import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value) ? (value as T[keyof T]) : fallback;
}

/** Public, unauthenticated endpoint reached by scanning the open house's QR code. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const openHouse = await prisma.openHouse.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!openHouse) return NextResponse.json({ ok: false, error: "Open house not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    openHouse: {
      id: openHouse.id,
      status: openHouse.status,
      startDate: openHouse.startDate,
      endDate: openHouse.endDate,
      property: openHouse.property
        ? { address: openHouse.property.address, city: openHouse.property.city, state: openHouse.property.state }
        : null,
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const openHouse = await prisma.openHouse.findUnique({ where: { id } });
  if (!openHouse) return NextResponse.json({ ok: false, error: "Open house not found" }, { status: 404 });

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
      isRegistered: true,
      interestLevel: parseEnum(InterestLevel, body.interestLevel, InterestLevel.NEUTRAL),
      followUpNeeded: body.interestLevel === "VERY_INTERESTED" || body.interestLevel === "INTERESTED",
      signedInAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, visitor }, { status: 201 });
}
