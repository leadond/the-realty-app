import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import { isPushConfigured } from "@/lib/push";

type SubscribeBody = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "push-notifications");
  if (denied) return denied;

  if (!isPushConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Push notifications are not configured. Add VAPID keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT) to your environment.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as SubscribeBody | null;
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { ok: false, error: "endpoint and keys.p256dh/keys.auth are required" },
      { status: 400 },
    );
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh, auth },
    update: { userId: user.id, p256dh, auth },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
