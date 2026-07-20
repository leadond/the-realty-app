import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const owned = await prisma.task.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });

  const body = await request.json();

  let title: string | undefined;
  if (body.title !== undefined) {
    title = String(body.title).trim();
    if (!title) {
      return NextResponse.json({ ok: false, error: "title cannot be empty" }, { status: 400 });
    }
  }

  let dueDate: Date | null | undefined;
  if (body.dueDate !== undefined) {
    if (body.dueDate) {
      const parsed = new Date(String(body.dueDate));
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ ok: false, error: "dueDate is invalid" }, { status: 400 });
      }
      dueDate = parsed;
    } else {
      dueDate = null;
    }
  }

  let isCompleted: boolean | undefined;
  let completedAt: Date | null | undefined;
  if (body.isCompleted !== undefined) {
    isCompleted = Boolean(body.isCompleted);
    completedAt = isCompleted ? new Date() : null;
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      title,
      notes: body.notes === undefined ? undefined : body.notes ? String(body.notes) : null,
      dueDate,
      isCompleted,
      completedAt,
    },
  });

  return NextResponse.json({ ok: true, task });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const owned = await prisma.task.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
