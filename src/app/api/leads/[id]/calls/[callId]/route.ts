import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = { params: Promise<{ id: string; callId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id, callId } = await context.params;
  const owned = await prisma.callLog.findFirst({ where: { id: callId, leadId: id, userId: user.id } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = await request.json();
  const call = await prisma.callLog.update({
    where: { id: callId },
    data: {
      notes: body.notes !== undefined ? String(body.notes) : undefined,
      durationMin: body.durationMin !== undefined ? Number(body.durationMin) : undefined,
    },
  });

  return NextResponse.json({ ok: true, call });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id, callId } = await context.params;
  const owned = await prisma.callLog.findFirst({ where: { id: callId, leadId: id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.callLog.delete({ where: { id: callId } });
  return NextResponse.json({ ok: true });
}
