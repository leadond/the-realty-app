import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.socialPost.findMany({
    where: { userId: user.id },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ok: true, posts });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.caption || !body.platform) {
    return NextResponse.json({ ok: false, error: "caption and platform are required" }, { status: 400 });
  }

  const post = await prisma.socialPost.create({
    data: {
      userId: user.id,
      propertyId: body.propertyId ? String(body.propertyId) : null,
      platform: String(body.platform),
      caption: String(body.caption),
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
      status: body.scheduledFor ? "SCHEDULED" : "DRAFT",
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
    },
  });

  return NextResponse.json({ ok: true, post }, { status: 201 });
}
