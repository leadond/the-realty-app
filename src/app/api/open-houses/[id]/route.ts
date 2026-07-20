import { NextResponse } from "next/server";
import { OpenHouseStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";

type RouteContext = { params: Promise<{ id: string }> };

function parseEnum<T extends Record<string, string>>(source: T, value: unknown) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : undefined;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "open-houses");
  if (denied) return denied;

  const { id } = await context.params;
  const openHouse = await prisma.openHouse.findFirst({
    where: { id, userId: user.id },
    include: { property: true, visitors: true },
  });
  if (!openHouse) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, openHouse });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "open-houses");
  if (denied) return denied;

  const { id } = await context.params;
  const owned = await prisma.openHouse.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = await request.json();
  const openHouse = await prisma.openHouse.update({
    where: { id },
    data: {
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      status: parseEnum(OpenHouseStatus, body.status),
      description: body.description === undefined ? undefined : body.description ? String(body.description) : null,
    },
  });
  return NextResponse.json({ ok: true, openHouse });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "open-houses");
  if (denied) return denied;

  const { id } = await context.params;
  const owned = await prisma.openHouse.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.openHouse.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
