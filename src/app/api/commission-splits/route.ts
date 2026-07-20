import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import { grossCommission, isSplitRole, splitDeduction } from "@/lib/commissions";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "commission-splits");
  if (denied) return denied;

  const transactionId = new URL(request.url).searchParams.get("transactionId");
  if (!transactionId) {
    return NextResponse.json({ ok: false, error: "transactionId is required" }, { status: 400 });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId: user.id },
    include: { commissionSplits: { orderBy: { createdAt: "asc" } } },
  });
  if (!transaction) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, splits: transaction.commissionSplits });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "commission-splits");
  if (denied) return denied;

  const body = await request.json();

  const transactionId = typeof body.transactionId === "string" ? body.transactionId : null;
  if (!transactionId) {
    return NextResponse.json({ ok: false, error: "transactionId is required" }, { status: 400 });
  }

  if (!isSplitRole(body.role)) {
    return NextResponse.json(
      { ok: false, error: "role must be one of REFERRING, CO_LISTING, CO_BUYING, TRANSACTION_COORDINATOR" },
      { status: 400 },
    );
  }

  const splitPercent = Number(body.splitPercent);
  if (!Number.isFinite(splitPercent) || splitPercent <= 0 || splitPercent > 100) {
    return NextResponse.json(
      { ok: false, error: "splitPercent must be a number between 0 and 100" },
      { status: 400 },
    );
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId: user.id },
  });
  if (!transaction) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const notesInput = typeof body.notes === "string" ? body.notes.trim() : "";
  let agentId = user.id;
  let notes = notesInput || null;

  const agentIdInput = typeof body.agentId === "string" ? body.agentId : null;
  const agentEmailInput = typeof body.agentEmail === "string" ? body.agentEmail.trim() : "";

  if (agentIdInput) {
    const teammate = await prisma.user.findFirst({
      where: { id: agentIdInput, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!teammate) {
      return NextResponse.json({ ok: false, error: "Agent not found in your organization" }, { status: 404 });
    }
    agentId = teammate.id;
  } else if (agentEmailInput) {
    const teammate = await prisma.user.findFirst({
      where: { email: agentEmailInput, organizationId: user.organizationId },
      select: { id: true, name: true, email: true },
    });
    if (teammate) {
      agentId = teammate.id;
    } else {
      // External referral partner: not a User in this system. Record the payee in
      // notes and attribute the FK to the transaction owner as a placeholder.
      const externalNote = `External payee: ${agentEmailInput}`;
      notes = notes ? `${externalNote} — ${notes}` : externalNote;
    }
  }

  const gross = grossCommission(transaction);
  const splitAmount = gross > 0 ? splitDeduction({ splitAmount: null, splitPercent }, gross) : null;

  const split = await prisma.commissionSplit.create({
    data: {
      transactionId: transaction.id,
      agentId,
      role: body.role,
      splitPercent,
      splitAmount,
      notes,
    },
  });

  return NextResponse.json({ ok: true, split }, { status: 201 });
}
