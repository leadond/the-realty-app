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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "A JSON object is required" }, { status: 400 });
  }

  if (!body.address || !body.city || !body.state || !body.zip || !body.price) {
    return NextResponse.json(
      { ok: false, error: "address, city, state, zip, and price are required" },
      { status: 400 },
    );
  }

  const mlsId = body.mlsId ? String(body.mlsId) : null;
  const data = {
      userId: user.id,
      organizationId: user.organizationId,
      mlsId,
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
      features: body.features ? String(body.features) : null,
      photos: body.photos ? String(body.photos) : null,
  };

  if (mlsId) {
    const existing = await prisma.property.findUnique({ where: { mlsId }, select: { id: true, userId: true } });
    if (existing && existing.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "That MLS listing is already saved by another user." }, { status: 409 });
    }
    if (existing) {
      const property = await prisma.property.update({ where: { id: existing.id }, data });
      return NextResponse.json({ ok: true, property });
    }
  }

  const property = await prisma.property.create({ data });

  return NextResponse.json({ ok: true, property }, { status: 201 });
}
