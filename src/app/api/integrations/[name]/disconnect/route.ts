import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = { params: Promise<{ name: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { name } = await context.params;
  const integration = await prisma.appIntegration.findUnique({ where: { name } });
  if (!integration) return NextResponse.json({ ok: false, error: "Unknown integration" }, { status: 404 });

  await prisma.userAppConnection.updateMany({
    where: { userId: user.id, integrationId: integration.id },
    data: { isActive: false, disconnectedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
