import { NextResponse } from "next/server";
import { TransactionType, TransactionStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : fallback;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "transactions");
  if (denied) return denied;

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { checklist: true },
  });
  return NextResponse.json({ ok: true, transactions });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "transactions");
  if (denied) return denied;

  const body = await request.json();

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      organizationId: user.organizationId,
      propertyId: body.propertyId ? String(body.propertyId) : null,
      type: parseEnum(TransactionType, body.type, TransactionType.PURCHASE),
      status: parseEnum(TransactionStatus, body.status, TransactionStatus.INITIATED),
      price: body.price ? Number(body.price) : null,
      closingDate: body.closingDate ? new Date(body.closingDate) : null,
      commission: body.commission ? Number(body.commission) : null,
      agentNotes: body.agentNotes ? String(body.agentNotes) : null,
    },
  });

  return NextResponse.json({ ok: true, transaction }, { status: 201 });
}
