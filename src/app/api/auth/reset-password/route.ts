import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPasswordResetToken } from "@/lib/password-reset";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = String(body?.token || "");
  const password = String(body?.password || "");

  if (!token) {
    return NextResponse.json({ ok: false, error: "Reset token is required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await verifyPasswordResetToken(token);
  if (!user) {
    return NextResponse.json({ ok: false, error: "This reset link is invalid or has expired" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(password) },
  });

  return NextResponse.json({ ok: true });
}
