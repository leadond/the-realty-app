import { NextResponse } from "next/server";
import { ContractType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import { renderContractTemplate } from "@/lib/contract-templates";

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value) ? (value as T[keyof T]) : fallback;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "contracts");
  if (denied) return denied;

  const contracts = await prisma.contract.findMany({
    where: { agentId: user.id },
    include: { signatures: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, contracts });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "contracts");
  if (denied) return denied;

  const body = await request.json();
  if (!body.buyerName || !body.buyerEmail) {
    return NextResponse.json({ ok: false, error: "Buyer name and email are required" }, { status: 400 });
  }

  const type = parseEnum(ContractType, body.type, ContractType.BUYER_REPRESENTATION);
  const content = renderContractTemplate(type, {
    agentName: user.name || user.email,
    brokerageName: user.organization?.name,
    buyerName: String(body.buyerName),
    propertyAddress: body.propertyAddress ? String(body.propertyAddress) : undefined,
    price: body.price ? `$${Number(body.price).toLocaleString()}` : undefined,
    commissionRate: body.commissionRate ? String(body.commissionRate) : undefined,
    termMonths: body.termMonths ? String(body.termMonths) : undefined,
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  });

  const contract = await prisma.contract.create({
    data: {
      organizationId: user.organizationId,
      agentId: user.id,
      leadId: body.leadId ? String(body.leadId) : null,
      type,
      title: body.title ? String(body.title) : `${type.replace(/_/g, " ")} — ${body.buyerName}`,
      buyerName: String(body.buyerName),
      buyerEmail: String(body.buyerEmail),
      content,
      status: "DRAFT",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ ok: true, contract }, { status: 201 });
}
