import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getStripeClient, isBillingConfigured } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  if (!isBillingConfigured()) {
    return NextResponse.json({ ok: false, error: "Billing is not configured." }, { status: 503 });
  }

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ ok: false, error: "No active subscription found" }, { status: 404 });
  }

  const origin = request.headers.get("origin") || process.env.NEXTAUTH_URL || "";

  try {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${origin}/dashboard/settings`,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Failed to open billing portal" }, { status: 502 });
  }
}
