import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/password-reset";

function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").toLowerCase().trim();

  let resetUrl: string | undefined;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    if (user?.password && process.env.NODE_ENV !== "production") {
      const token = createPasswordResetToken(user.id, user.password);
      resetUrl = `${getRequestOrigin(request)}/reset-password?token=${encodeURIComponent(token)}`;
    }
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, password reset instructions will be available.",
    resetUrl,
  });
}
