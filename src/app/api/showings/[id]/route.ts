import { NextResponse } from "next/server";
import { ShowingStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ensureDemoWorkspace } from "@/lib/seed";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseEnum<T extends Record<string, string>>(source: T, value: unknown) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : undefined;
}

export async function GET(_request: Request, context: RouteContext) {
  await ensureDemoWorkspace();
  const { id } = await context.params;
  const showing = await prisma.showing.findUnique({
    where: { id },
    include: { property: true, lead: true },
  });

  if (!showing) {
    return NextResponse.json({ ok: false, error: "Showing not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, showing });
}

export async function PATCH(request: Request, context: RouteContext) {
  await ensureDemoWorkspace();
  const { id } = await context.params;
  const body = await request.json();

  const showing = await prisma.showing.update({
    where: { id },
    data: {
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      status: parseEnum(ShowingStatus, body.status),
      durationMin: body.durationMin === undefined ? undefined : Number(body.durationMin),
      notes: body.notes === undefined ? undefined : body.notes ? String(body.notes) : null,
      feedback: body.feedback === undefined ? undefined : body.feedback ? String(body.feedback) : null,
    },
  });

  return NextResponse.json({ ok: true, showing });
}

export async function DELETE(_request: Request, context: RouteContext) {
  await ensureDemoWorkspace();
  const { id } = await context.params;
  await prisma.showing.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
