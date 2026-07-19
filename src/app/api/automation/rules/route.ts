import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const rules = await prisma.automationRule.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { executions: true } } },
  });

  return NextResponse.json({ ok: true, rules });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name || !body.triggerType || !body.actionType) {
    return NextResponse.json({ ok: false, error: "name, triggerType, and actionType are required" }, { status: 400 });
  }

  const rule = await prisma.automationRule.create({
    data: {
      userId: user.id,
      name: String(body.name),
      triggerType: String(body.triggerType),
      triggerConfig: JSON.stringify(body.triggerConfig || {}),
      actionType: String(body.actionType),
      actionConfig: JSON.stringify(body.actionConfig || {}),
      isActive: true,
    },
  });

  return NextResponse.json({ ok: true, rule }, { status: 201 });
}
