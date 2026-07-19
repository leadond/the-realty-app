import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const reminders = await prisma.followUp.findMany({
    where: { userId: user.id, status: { in: ["PENDING", "SCHEDULED"] } },
    orderBy: { scheduledFor: "asc" },
  });

  return NextResponse.json({ ok: true, reminders });
}
