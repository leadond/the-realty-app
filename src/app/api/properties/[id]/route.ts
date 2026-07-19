import { NextResponse } from "next/server";
import { PropertyListingStatus, PropertyTypeEnum } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = { params: Promise<{ id: string }> };

function parseEnum<T extends Record<string, string>>(source: T, value: unknown) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : undefined;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const property = await prisma.property.findFirst({ where: { id, userId: user.id } });
  if (!property) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, property });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const owned = await prisma.property.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = await request.json();
  const property = await prisma.property.update({
    where: { id },
    data: {
      address: body.address === undefined ? undefined : String(body.address),
      city: body.city === undefined ? undefined : String(body.city),
      state: body.state === undefined ? undefined : String(body.state),
      zip: body.zip === undefined ? undefined : String(body.zip),
      price: body.price === undefined ? undefined : Number(body.price),
      bedrooms: body.bedrooms === undefined ? undefined : Number(body.bedrooms),
      bathrooms: body.bathrooms === undefined ? undefined : Number(body.bathrooms),
      sqft: body.sqft === undefined ? undefined : body.sqft ? Number(body.sqft) : null,
      status: parseEnum(PropertyListingStatus, body.status),
      propertyType: parseEnum(PropertyTypeEnum, body.propertyType),
      description: body.description === undefined ? undefined : body.description ? String(body.description) : null,
    },
  });
  return NextResponse.json({ ok: true, property });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const owned = await prisma.property.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
