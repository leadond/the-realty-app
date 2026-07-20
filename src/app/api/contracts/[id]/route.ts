import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "contracts");
  if (denied) return denied;

  const { id } = await context.params;
  const contract = await prisma.contract.findFirst({
    where: { id, agentId: user.id },
    include: { signatures: true },
  });
  if (!contract) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, contract });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "contracts");
  if (denied) return denied;

  const { id } = await context.params;
  const owned = await prisma.contract.findFirst({ where: { id, agentId: user.id } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = await request.json();

  // Sending for signature: agent signs their own copy immediately (they're authenticated here).
  if (body.action === "send") {
    const existingAgentSig = await prisma.contractSignature.findFirst({
      where: { contractId: owned.id, role: "agent" },
    });
    if (!existingAgentSig) {
      await prisma.contractSignature.create({
        data: {
          contractId: owned.id,
          signer: user.name || user.email,
          email: user.email,
          role: "agent",
          signatureData: body.signatureData ? String(body.signatureData) : null,
          signedAt: new Date(),
        },
      });
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: { status: "SENT_FOR_SIGNATURE" },
      include: { signatures: true },
    });
    return NextResponse.json({ ok: true, contract });
  }

  const contract = await prisma.contract.update({
    where: { id },
    data: {
      status: body.status || undefined,
      content: body.content !== undefined ? String(body.content) : undefined,
    },
    include: { signatures: true },
  });
  return NextResponse.json({ ok: true, contract });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "contracts");
  if (denied) return denied;

  const { id } = await context.params;
  const owned = await prisma.contract.findFirst({ where: { id, agentId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
