import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import { grossCommission, splitDeduction } from "@/lib/commissions";

type RouteContext = { params: Promise<{ id: string }> };

async function loadOwnedSplit(splitId: string, userId: string) {
  return prisma.commissionSplit.findFirst({
    where: { id: splitId, transaction: { userId } },
    include: { transaction: true },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "commission-splits");
  if (denied) return denied;

  const { id } = await context.params;
  const existing = await loadOwnedSplit(id, user.id);
  if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = await request.json();

  let splitPercent = existing.splitPercent;
  if (body.splitPercent !== undefined) {
    const parsed = Number(body.splitPercent);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
      return NextResponse.json(
        { ok: false, error: "splitPercent must be a number between 0 and 100" },
        { status: 400 },
      );
    }
    splitPercent = parsed;
  }

  const gross = grossCommission(existing.transaction);
  const splitAmount = gross > 0 ? splitDeduction({ splitAmount: null, splitPercent }, gross) : null;

  const split = await prisma.commissionSplit.update({
    where: { id },
    data: {
      splitPercent,
      splitAmount,
      notes: body.notes !== undefined ? (String(body.notes).trim() || null) : undefined,
    },
  });

  return NextResponse.json({ ok: true, split });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "commission-splits");
  if (denied) return denied;

  const { id } = await context.params;
  const existing = await loadOwnedSplit(id, user.id);
  if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.commissionSplit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
