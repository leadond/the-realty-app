import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Public signing endpoint — reached via an unguessable contract-id link
 * (e.g. /sign/{id}), not behind session auth, so a buyer/seller who never
 * created an account can sign. Validates the submitted email matches the
 * contract's on-file buyer email as a lightweight identity check.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { signatures: true },
  });
  if (!contract) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    contract: {
      id: contract.id,
      title: contract.title,
      content: contract.content,
      buyerName: contract.buyerName,
      buyerEmail: contract.buyerEmail,
      status: contract.status,
      expiresAt: contract.expiresAt,
      signatures: contract.signatures.map((s) => ({ role: s.role, signedAt: s.signedAt })),
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  if (contract.expiresAt && contract.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "This signing link has expired" }, { status: 410 });
  }
  if (contract.status === "SIGNED") {
    return NextResponse.json({ ok: false, error: "This contract has already been fully signed" }, { status: 409 });
  }

  const body = await request.json();
  const email = String(body.email || "").toLowerCase().trim();
  const signatureData = body.signatureData ? String(body.signatureData) : null;

  if (!signatureData) {
    return NextResponse.json({ ok: false, error: "A signature is required" }, { status: 400 });
  }
  if (!contract.buyerEmail || email !== contract.buyerEmail.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Email does not match the contract on file" }, { status: 403 });
  }

  const existing = await prisma.contractSignature.findFirst({
    where: { contractId: contract.id, role: "buyer" },
  });
  if (existing) {
    return NextResponse.json({ ok: false, error: "This contract has already been signed" }, { status: 409 });
  }

  await prisma.contractSignature.create({
    data: {
      contractId: contract.id,
      signer: contract.buyerName,
      email: contract.buyerEmail,
      role: "buyer",
      signatureData,
      signedAt: new Date(),
      ipAddress: request.headers.get("x-forwarded-for") || null,
    },
  });

  const agentSig = await prisma.contractSignature.findFirst({
    where: { contractId: contract.id, role: "agent" },
  });

  const updated = await prisma.contract.update({
    where: { id: contract.id },
    data: agentSig
      ? { status: "SIGNED", signedAt: new Date() }
      : { status: "PARTIALLY_SIGNED" },
  });

  return NextResponse.json({ ok: true, contract: { id: updated.id, status: updated.status } });
}
