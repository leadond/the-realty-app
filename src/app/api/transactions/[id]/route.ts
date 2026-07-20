import { NextResponse } from "next/server";
import { TransactionType, TransactionStatus } from "@prisma/client";

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

  const denied = requireTierResponse(user.planTier, "transactions");
  if (denied) return denied;

  const { id } = await context.params;
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
    include: { checklist: true },
  });
  if (!transaction) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, transaction });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "transactions");
  if (denied) return denied;

  const { id } = await context.params;
  const owned = await prisma.transaction.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = await request.json();
  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      type: parseEnum(TransactionType, body.type),
      status: parseEnum(TransactionStatus, body.status),
      price: body.price === undefined ? undefined : Number(body.price),
      closingDate: body.closingDate ? new Date(body.closingDate) : undefined,
      commission: body.commission === undefined ? undefined : Number(body.commission),
      agentNotes: body.agentNotes === undefined ? undefined : String(body.agentNotes),
    },
  });
  return NextResponse.json({ ok: true, transaction });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "transactions");
  if (denied) return denied;

  const { id } = await context.params;
  const owned = await prisma.transaction.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
