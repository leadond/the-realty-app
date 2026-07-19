import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { renderPlaceholders, sendEmail, textToHtml } from "@/lib/email/resend";

/**
 * System-triggered automation runner, invoked by Vercel Cron (see
 * vercel.json). Not behind session auth — instead checks CRON_SECRET,
 * which Vercel automatically sends as a Bearer token for scheduled
 * invocations when that env var is set. Evaluates every active
 * AutomationRule across all users and executes matching actions.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const rules = await prisma.automationRule.findMany({ where: { isActive: true } });
  let totalExecuted = 0;

  for (const rule of rules) {
    const triggerConfig = safeParse(rule.triggerConfig);
    const actionConfig = safeParse(rule.actionConfig);

    const candidates = await findCandidates(rule.userId, rule.triggerType, triggerConfig);

    for (const candidate of candidates) {
      const already = await prisma.automationExecution.findFirst({
        where: { ruleId: rule.id, leadId: candidate.id },
      });
      if (already) continue;

      const result = await executeAction(rule.userId, rule.actionType, actionConfig, candidate);

      await prisma.automationExecution.create({
        data: {
          ruleId: rule.id,
          leadId: candidate.id,
          status: result.ok ? "EXECUTED" : "FAILED",
          result: result.message,
        },
      });
      totalExecuted++;
    }
  }

  return NextResponse.json({ ok: true, rulesEvaluated: rules.length, actionsExecuted: totalExecuted });
}

function safeParse(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}

type Candidate = { id: string; email: string | null; firstName: string; lastName: string };

async function findCandidates(userId: string, triggerType: string, config: Record<string, unknown>): Promise<Candidate[]> {
  if (triggerType === "lead_status_changed") {
    const status = typeof config.status === "string" ? config.status : undefined;
    if (!status) return [];
    return prisma.lead.findMany({
      where: { userId, status: status as never },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
  }

  if (triggerType === "no_response_days") {
    const days = typeof config.days === "number" ? config.days : 5;
    const status = typeof config.status === "string" ? config.status : "CONTACTED";
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.lead.findMany({
      where: { userId, status: status as never, updatedAt: { lte: cutoff } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
  }

  if (triggerType === "showing_scheduled") {
    const showings = await prisma.showing.findMany({
      where: { userId, status: "SCHEDULED", leadId: { not: null } },
      include: { lead: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    return showings.filter((s) => s.lead).map((s) => s.lead as Candidate);
  }

  if (triggerType === "open_house_visitor") {
    const visitors = await prisma.visitor.findMany({
      where: { followUpNeeded: true, openHouse: { userId } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    return visitors;
  }

  return [];
}

async function executeAction(
  userId: string,
  actionType: string,
  config: Record<string, unknown>,
  candidate: Candidate,
): Promise<{ ok: boolean; message: string }> {
  if (actionType === "create_reminder") {
    const subject = typeof config.subject === "string" ? config.subject : `Follow up with ${candidate.firstName}`;
    await prisma.followUp.create({
      data: {
        userId,
        leadId: candidate.id,
        subject,
        type: "OTHER",
        status: "PENDING",
        scheduledFor: new Date(),
        content: typeof config.note === "string" ? config.note : null,
      },
    });
    return { ok: true, message: "Reminder created" };
  }

  if (actionType === "send_email") {
    if (!candidate.email) return { ok: false, message: "No email on file" };
    const subject = typeof config.subject === "string" ? config.subject : "Following up";
    const bodyTemplate = typeof config.body === "string" ? config.body : "Hi {{first_name}}, just checking in!";
    const body = renderPlaceholders(bodyTemplate, {
      first_name: candidate.firstName,
      last_name: candidate.lastName,
    });
    const result = await sendEmail(candidate.email, subject, textToHtml(body));
    return { ok: result.ok, message: result.ok ? "Email sent" : result.error };
  }

  return { ok: false, message: `Unknown action type: ${actionType}` };
}
