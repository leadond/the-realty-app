import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  const accountType = body.accountType === "broker" || body.accountType === "invite" ? body.accountType : "agent";
  const brokerageName = body.brokerageName ? String(body.brokerageName).trim() : "";
  const inviteToken = body.inviteToken ? String(body.inviteToken).trim() : "";

  if (!name || !email || !password) {
    return NextResponse.json({ ok: false, error: "Name, email, and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  if (accountType === "broker") {
    if (!brokerageName) {
      return NextResponse.json({ ok: false, error: "Brokerage name is required" }, { status: 400 });
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email, password: passwordHash, role: "BROKER" },
      });
      const org = await tx.organization.create({
        data: { name: brokerageName, brokerUserId: created.id },
      });
      return tx.user.update({
        where: { id: created.id },
        data: { organizationId: org.id },
      });
    });

    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
  }

  if (accountType === "invite") {
    if (!inviteToken) {
      return NextResponse.json({ ok: false, error: "Invite code is required" }, { status: 400 });
    }

    const invite = await prisma.orgInvite.findUnique({ where: { token: inviteToken } });
    if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, error: "That invite code is invalid or has expired" }, { status: 400 });
    }
    if (invite.email.toLowerCase() !== email) {
      return NextResponse.json({ ok: false, error: "This invite was issued to a different email address" }, { status: 400 });
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role: invite.role,
          organizationId: invite.organizationId,
        },
      });
      await tx.orgInvite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });
      return created;
    });

    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
  }

  const user = await prisma.user.create({
    data: { name, email, password: passwordHash, role: "USER" },
  });

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
}
