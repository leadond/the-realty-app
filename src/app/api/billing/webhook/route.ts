import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { getStripeClient, isBillingConfigured } from "@/lib/billing/stripe";

const TIER_BY_PLAN: Record<string, "PRO" | "ENTERPRISE"> = {
  pro: "PRO",
  professional: "ENTERPRISE",
};

const TOKEN_LIMIT_BY_TIER: Record<string, number> = {
  PRO: 500000,
  ENTERPRISE: 5000000,
};

/**
 * Stripe webhook — not behind session auth (Stripe has no user session);
 * instead verifies the request signature with STRIPE_WEBHOOK_SECRET.
 * Not covered by the middleware matcher, so it stays publicly reachable.
 */
export async function POST(request: Request) {
  if (!isBillingConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Billing webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return NextResponse.json({ error: `Invalid signature: ${e instanceof Error ? e.message : "unknown"}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    if (userId && plan) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          plan,
          status: "active",
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
        },
      });

      const tier = TIER_BY_PLAN[plan];
      if (tier) {
        await prisma.user.update({
          where: { id: userId },
          data: { aiTier: tier, monthlyTokenLimit: TOKEN_LIMIT_BY_TIER[tier] },
        });
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const existing = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (existing) {
      await prisma.subscription.update({ where: { id: existing.id }, data: { status: "canceled" } });
      await prisma.user.update({
        where: { id: existing.userId },
        data: { aiTier: "FREE", monthlyTokenLimit: 20000 },
      });
    }
  }

  return NextResponse.json({ received: true });
}
