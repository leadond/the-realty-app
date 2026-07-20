import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";

type RouteContext = { params: Promise<{ id: string }> };

const KNOWN_EVENTS = ["lead.created", "showing.scheduled", "contract.signed"];

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "webhooks");
  if (denied) return denied;

  const { id } = await context.params;
  const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id } });
  if (!endpoint || endpoint.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: { isActive?: boolean; url?: string; events?: string } = {};

  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (body.url !== undefined) {
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
    data.url = parsedUrl.toString();
  }

  if (body.events !== undefined) {
    const events = Array.isArray(body.events)
      ? body.events.filter((event: unknown): event is string => typeof event === "string" && KNOWN_EVENTS.includes(event))
      : [];
    if (events.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Select at least one valid event" },
        { status: 400 },
      );
    }
    data.events = events.join(",");
  }

  const updated = await prisma.webhookEndpoint.update({
    where: { id },
    data,
    select: { id: true, url: true, events: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, endpoint: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "webhooks");
  if (denied) return denied;

  const { id } = await context.params;
  const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id } });
  if (!endpoint || endpoint.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  await prisma.webhookEndpoint.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
