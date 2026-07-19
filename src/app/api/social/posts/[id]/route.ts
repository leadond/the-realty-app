import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const owned = await prisma.socialPost.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = await request.json();

  const post = await prisma.socialPost.update({
    where: { id },
    data: {
      caption: body.caption !== undefined ? String(body.caption) : undefined,
      scheduledFor: body.scheduledFor !== undefined ? (body.scheduledFor ? new Date(body.scheduledFor) : null) : undefined,
      status: body.status || undefined,
      postedAt: body.status === "POSTED" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ ok: true, post });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const owned = await prisma.socialPost.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.socialPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
