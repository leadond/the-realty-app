import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: "endpoint is required" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });

  return NextResponse.json({ ok: true });
}
