import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import { isIntegrationConfigured } from "@/lib/integrations/registry";

type RouteContext = { params: Promise<{ name: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "connected-apps");
  if (denied) return denied;

  const { name } = await context.params;
  const integration = await prisma.appIntegration.findUnique({ where: { name } });
  if (!integration) return NextResponse.json({ ok: false, error: "Unknown integration" }, { status: 404 });

  const body = await request.json().catch(() => ({}));

  if (name === "slack") {
    const webhookUrl = String(body.webhookUrl || "");
    if (!/^https:\/\/hooks\.slack\.com\/services\//.test(webhookUrl)) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid Slack Incoming Webhook URL (starts with https://hooks.slack.com/services/)" },
        { status: 400 },
      );
    }

    const connection = await prisma.userAppConnection.upsert({
      where: { userId_integrationId: { userId: user.id, integrationId: integration.id } },
      update: { webhookUrl, isActive: true, disconnectedAt: null },
      create: { userId: user.id, integrationId: integration.id, webhookUrl, isActive: true },
    });

    return NextResponse.json({ ok: true, connection });
  }

  if (!isIntegrationConfigured(name)) {
    return NextResponse.json(
      {
        ok: false,
        error: `${integration.displayName} requires a developer app. Add its client ID/secret as environment variables in Vercel, then redeploy to enable connecting.`,
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { ok: false, error: `${integration.displayName} OAuth connect is not yet wired up in this build.` },
    { status: 501 },
  );
}
