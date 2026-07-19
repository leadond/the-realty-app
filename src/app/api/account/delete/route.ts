import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

/**
 * GDPR-style self-service account deletion. Cascades to all data owned by
 * this user (leads, properties, showings, contracts, etc.) via the
 * onDelete: Cascade relations declared in the Prisma schema.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (String(body.confirm || "") !== user.email) {
    return NextResponse.json({ ok: false, error: "Type your email address exactly to confirm deletion" }, { status: 400 });
  }

  if (user.role === "BROKER" && user.organizationId) {
    const teammates = await prisma.user.count({
      where: { organizationId: user.organizationId, id: { not: user.id } },
    });
    if (teammates > 0) {
      return NextResponse.json(
        { ok: false, error: `Your organization still has ${teammates} other member(s). Remove them or transfer ownership before deleting your account.` },
        { status: 409 },
      );
    }
    await prisma.organization.delete({ where: { id: user.organizationId } });
  }

  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
