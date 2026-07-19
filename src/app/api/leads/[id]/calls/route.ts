import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const owned = await prisma.lead.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });

  const calls = await prisma.callLog.findMany({
    where: { leadId: id },
    orderBy: { calledAt: "desc" },
  });

  return NextResponse.json({ ok: true, calls });
}

/** Logs that the agent tapped to call this lead. Called right after the agent confirms — the browser has no way to know if the call actually connects once tel: hands off to the OS dialer. */
export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const lead = await prisma.lead.findFirst({ where: { id, userId: user.id }, select: { id: true, phone: true } });
  if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const phoneNumber = String(body.phoneNumber || lead.phone || "");
  if (!phoneNumber) {
    return NextResponse.json({ ok: false, error: "phoneNumber is required" }, { status: 400 });
  }

  const call = await prisma.callLog.create({
    data: {
      userId: user.id,
      leadId: id,
      phoneNumber,
      notes: body.notes ? String(body.notes) : null,
    },
  });

  return NextResponse.json({ ok: true, call }, { status: 201 });
}
