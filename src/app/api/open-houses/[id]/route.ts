import { NextResponse } from "next/server";
import { OpenHouseStatus, InterestLevel } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ensureDemoWorkspace } from "@/lib/seed";

type RouteContext = { params: Promise<{ id: string }> };

function parseEnum<T extends Record<string, string>>(source: T, value: unknown) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : undefined;
}

export async function GET(_request: Request, context: RouteContext) {
  await ensureDemoWorkspace();
  const { id } = await context.params;
  const openHouse = await prisma.openHouse.findUnique({
    where: { id },
    include: { property: true, visitors: true },
  });
  if (!openHouse) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, openHouse });
}

export async function PATCH(request: Request, context: RouteContext) {
  await ensureDemoWorkspace();
  const { id } = await context.params;
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
  await ensureDemoWorkspace();
  const { id } = await context.params;
  await prisma.openHouse.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
