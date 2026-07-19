import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getPriceId, getStripeClient, isBillingConfigured } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  if (!isBillingConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Billing is not configured. Add STRIPE_SECRET_KEY (and STRIPE_PRICE_PRO / STRIPE_PRICE_PROFESSIONAL) in Vercel and redeploy." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const plan = String(body.plan || "");
  const priceId = getPriceId(plan);
  if (!priceId) {
    return NextResponse.json({ ok: false, error: `No price configured for plan "${plan}"` }, { status: 400 });
  }

  const origin = request.headers.get("origin") || process.env.NEXTAUTH_URL || "";

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.organizationId || user.id,
      success_url: `${origin}/dashboard/settings?billing=success`,
      cancel_url: `${origin}/dashboard/settings?billing=canceled`,
      metadata: { userId: user.id, organizationId: user.organizationId || "", plan },
    });

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { plan, status: "pending" },
      create: { userId: user.id, plan, status: "pending" },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Failed to start checkout" }, { status: 502 });
  }
}
