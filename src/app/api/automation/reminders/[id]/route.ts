import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "automations");
  if (denied) return denied;

  const { id } = await context.params;
  const owned = await prisma.followUp.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const followUp = await prisma.followUp.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  return NextResponse.json({ ok: true, followUp });
}
