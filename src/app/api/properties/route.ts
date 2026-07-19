import { NextResponse } from "next/server";
import { PropertyListingStatus, PropertyTypeEnum } from "@prisma/client";

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

  const properties = await prisma.property.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ ok: true, properties });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.address || !body.city || !body.state || !body.zip || !body.price) {
    return NextResponse.json(
      { ok: false, error: "address, city, state, zip, and price are required" },
      { status: 400 },
    );
  }

  const property = await prisma.property.create({
    data: {
      userId: user.id,
      organizationId: user.organizationId,
      address: String(body.address),
      city: String(body.city),
      state: String(body.state),
      zip: String(body.zip),
      price: Number(body.price),
      bedrooms: body.bedrooms ? Number(body.bedrooms) : 0,
      bathrooms: body.bathrooms ? Number(body.bathrooms) : 0,
      sqft: body.sqft ? Number(body.sqft) : null,
      lotSize: body.lotSize ? Number(body.lotSize) : null,
      yearBuilt: body.yearBuilt ? Number(body.yearBuilt) : null,
      propertyType: parseEnum(PropertyTypeEnum, body.propertyType, PropertyTypeEnum.SINGLE_FAMILY),
      status: parseEnum(PropertyListingStatus, body.status, PropertyListingStatus.ACTIVE),
      description: body.description ? String(body.description) : null,
    },
  });

  return NextResponse.json({ ok: true, property }, { status: 201 });
}
