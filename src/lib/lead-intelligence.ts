import { prisma } from "@/lib/db";

export type RiskLevel = "GREEN" | "YELLOW" | "RED";

export type RiskCheckResult = {
  riskScore: number;
  riskLevel: RiskLevel;
  warnings: string[];
  contactedByOrgs: number;
  contactedByAgents: number;
  globalLeadId: string | null;
};

/**
 * Cross-workspace lead intelligence: flags buyers who have been contacted by
 * many different agents/organizations, or who have a history of going quiet
 * after initial contact ("ghosting"). Runs on every new lead creation.
 */
export async function checkGlobalLeadRisk(
  firstName: string,
  lastName: string,
  email?: string | null,
  phone?: string | null,
): Promise<RiskCheckResult> {
  const record = await findOrCreateGlobalRecord(firstName, lastName, email, phone);

  const events = await prisma.leadContactEvent.findMany({
    where: { globalLeadId: record.id },
  });

  const ghostCount = events.filter((e) => e.actionType === "ghosted").length;
  const orgIds = new Set(events.map((e) => e.organizationId).filter(Boolean));
  const agentIds = new Set(events.map((e) => e.agentId));

  let riskScore = 0;
  const warnings: string[] = [];

  if (orgIds.size > 1) {
    riskScore += (orgIds.size - 1) * 15;
    warnings.push(`Contacted by ${orgIds.size} different brokerages`);
  }
  if (agentIds.size > 2) {
    riskScore += Math.min(agentIds.size * 5, 40);
    warnings.push(`${agentIds.size} different agents have contacted this buyer`);
  }
  if (ghostCount > 0) {
    riskScore += Math.min(ghostCount * 25, 40);
    warnings.push(`Has gone quiet after contact ${ghostCount} time(s) before`);
  }

  riskScore = Math.min(Math.round(riskScore), 100);
  const riskLevel: RiskLevel = riskScore < 25 ? "GREEN" : riskScore < 60 ? "YELLOW" : "RED";

  return {
    riskScore,
    riskLevel,
    warnings,
    contactedByOrgs: orgIds.size,
    contactedByAgents: agentIds.size,
    globalLeadId: record.id,
  };
}

async function findOrCreateGlobalRecord(
  firstName: string,
  lastName: string,
  email?: string | null,
  phone?: string | null,
) {
  if (email) {
    const byEmail = await prisma.globalLeadRecord.findFirst({ where: { email } });
    if (byEmail) return byEmail;
  }
  if (phone) {
    const byPhone = await prisma.globalLeadRecord.findFirst({ where: { phone } });
    if (byPhone) return byPhone;
  }
  const byName = await prisma.globalLeadRecord.findFirst({
    where: { firstName: { equals: firstName, mode: "insensitive" }, lastName: { equals: lastName, mode: "insensitive" } },
  });
  if (byName) return byName;

  return prisma.globalLeadRecord.create({
    data: { firstName, lastName, email: email || null, phone: phone || null },
  });
}

/**
 * Records that an agent took an action on a lead. Call this whenever a lead
 * is created (actionType: "contacted") or its status meaningfully changes
 * (e.g. "ghosted" when a lead goes stale with no follow-up).
 */
export async function recordLeadContactEvent(
  globalLeadId: string,
  organizationId: string | null,
  agentId: string,
  actionType: string,
) {
  await prisma.leadContactEvent.create({
    data: { globalLeadId, organizationId, agentId, actionType },
  });

  const orgIds = await prisma.leadContactEvent.findMany({
    where: { globalLeadId },
    select: { organizationId: true },
    distinct: ["organizationId"],
  });

  await prisma.globalLeadRecord.update({
    where: { id: globalLeadId },
    data: {
      lastContact: new Date(),
      contactCount: { increment: 1 },
      organizationCount: orgIds.filter((o) => o.organizationId).length,
    },
  });
}
