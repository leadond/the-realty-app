import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { ensureIntegrationsSeeded, isIntegrationConfigured } from "@/lib/integrations/registry";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  await ensureIntegrationsSeeded();

  const [integrations, connections] = await Promise.all([
    prisma.appIntegration.findMany({ orderBy: { displayName: "asc" } }),
    prisma.userAppConnection.findMany({ where: { userId: user.id } }),
  ]);

  const result = integrations.map((i) => {
    const connection = connections.find((c) => c.integrationId === i.id);
    return {
      id: i.id,
      name: i.name,
      displayName: i.displayName,
      description: i.description,
      category: i.category,
      canImport: i.canImport,
      canSync: i.canSync,
      requiresCredentials: i.requiresCredentials,
      supportLevel: i.supportLevel,
      isConfigured: isIntegrationConfigured(i.name),
      isConnected: Boolean(connection?.isActive),
      lastSyncAt: connection?.lastSyncAt || null,
    };
  });

  return NextResponse.json({ ok: true, integrations: result });
}
