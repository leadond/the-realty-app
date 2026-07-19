import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BROKER" || !user.organizationId) {
    return NextResponse.json({ ok: false, error: "Broker access required" }, { status: 403 });
  }

  const orgId = user.organizationId;

  const [members, leads, properties, transactions, pendingContracts] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.lead.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, firstName: true, lastName: true, status: true, priority: true, budgetMax: true, userId: true, riskLevel: true },
    }),
    prisma.property.findMany({
      where: { organizationId: orgId },
      select: { id: true, address: true, city: true, state: true, price: true, status: true, userId: true },
    }),
    prisma.transaction.findMany({
      where: { organizationId: orgId },
      select: { id: true, status: true, price: true, commission: true, userId: true, closingDate: true },
    }),
    prisma.contract.count({
      where: { organizationId: orgId, status: { in: ["SENT_FOR_SIGNATURE", "PARTIALLY_SIGNED"] } },
    }),
  ]);

  const memberStats = members.map((m) => ({
    ...m,
    leadCount: leads.filter((l) => l.userId === m.id).length,
    propertyCount: properties.filter((p) => p.userId === m.id).length,
    closedDeals: transactions.filter((t) => t.userId === m.id && t.status === "CLOSED").length,
    totalCommission: transactions
      .filter((t) => t.userId === m.id && t.status === "CLOSED")
      .reduce((sum, t) => sum + (t.commission || 0), 0),
  }));

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.budgetMax || 0), 0);
  const totalCommission = transactions
    .filter((t) => t.status === "CLOSED")
    .reduce((sum, t) => sum + (t.commission || 0), 0);
  const highRiskLeads = leads.filter((l) => l.riskLevel === "RED").length;

  return NextResponse.json({
    ok: true,
    members: memberStats,
    leads,
    properties,
    transactions,
    pendingContracts,
    totals: {
      memberCount: members.length,
      leadCount: leads.length,
      propertyCount: properties.length,
      totalPipelineValue,
      totalCommission,
      highRiskLeads,
    },
  });
}
