import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import { deleteUserFile } from "@/lib/storage/blob";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "file-storage");
  if (denied) return denied;

  const { id } = await context.params;
  const owned = await prisma.document.findFirst({
    where: { id, userId: user.id },
    select: { id: true, url: true },
  });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.document.delete({ where: { id: owned.id } });
  await deleteUserFile(owned.url);

  return NextResponse.json({ ok: true });
}
