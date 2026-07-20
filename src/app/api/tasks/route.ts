import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: [
      { isCompleted: "asc" },
      { dueDate: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({ ok: true, tasks });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
  }

  let dueDate: Date | null = null;
  if (body.dueDate) {
    const parsed = new Date(String(body.dueDate));
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ ok: false, error: "dueDate is invalid" }, { status: 400 });
    }
    dueDate = parsed;
  }

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title,
      notes: body.notes ? String(body.notes) : null,
      dueDate,
    },
  });

  return NextResponse.json({ ok: true, task }, { status: 201 });
}
