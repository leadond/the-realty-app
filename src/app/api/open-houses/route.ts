import { NextResponse } from "next/server";
import { OpenHouseStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : fallback;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const openHouses = await prisma.openHouse.findMany({
    where: { userId: user.id },
    orderBy: { startDate: "asc" },
    include: { property: true, visitors: true },
  });

  return NextResponse.json({ ok: true, openHouses });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.startDate || !body.endDate || !body.propertyId) {
    return NextResponse.json(
      { ok: false, error: "startDate, endDate, and propertyId are required" },
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

  const openHouse = await prisma.openHouse.create({
    data: {
      userId: user.id,
      propertyId: String(body.propertyId),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      status: parseEnum(OpenHouseStatus, body.status, OpenHouseStatus.UPCOMING),
      description: body.description ? String(body.description) : null,
      specialInstructions: body.specialInstructions ? String(body.specialInstructions) : null,
    },
  });

  return NextResponse.json({ ok: true, openHouse }, { status: 201 });
}
