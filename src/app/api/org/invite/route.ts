import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BROKER" || !user.organizationId) {
    return NextResponse.json({ ok: false, error: "Broker access required" }, { status: 403 });
  }

  const invites = await prisma.orgInvite.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, invites });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "BROKER" || !user.organizationId) {
    return NextResponse.json({ ok: false, error: "Broker access required" }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email || "").toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ ok: false, error: "That email already has an account" }, { status: 409 });
  }

  const token = crypto.randomBytes(16).toString("hex");
  const invite = await prisma.orgInvite.create({
    data: {
      organizationId: user.organizationId,
      email,
      role: "AGENT",
      token,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ ok: true, invite }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "BROKER" || !user.organizationId) {
    return NextResponse.json({ ok: false, error: "Broker access required" }, { status: 403 });
  }

  const { id } = await request.json();
  const invite = await prisma.orgInvite.findFirst({ where: { id: String(id), organizationId: user.organizationId } });
  if (!invite) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.orgInvite.update({ where: { id: invite.id }, data: { status: "REVOKED" } });
  return NextResponse.json({ ok: true });
}
