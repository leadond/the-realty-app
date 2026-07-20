import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";

const KNOWN_EVENTS = ["lead.created", "showing.scheduled", "contract.signed"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "webhooks");
  if (denied) return denied;

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, events: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, endpoints });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "webhooks");
  if (denied) return denied;

  const body = await request.json();

  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ ok: false, error: "A valid URL is required" }, { status: 400 });
  }
  if (parsedUrl.protocol !== "https:") {
    return NextResponse.json({ ok: false, error: "URL must use https://" }, { status: 400 });
  }

  const events = Array.isArray(body.events)
    ? body.events.filter((event: unknown): event is string => typeof event === "string" && KNOWN_EVENTS.includes(event))
    : [];
  if (events.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Select at least one valid event" },
      { status: 400 },
    );
  }

  const secret = randomBytes(32).toString("hex");

  const endpoint = await prisma.webhookEndpoint.create({
    data: {
      userId: user.id,
      url: parsedUrl.toString(),
      events: events.join(","),
      secret,
    },
    select: { id: true, url: true, events: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, endpoint, secret }, { status: 201 });
}
