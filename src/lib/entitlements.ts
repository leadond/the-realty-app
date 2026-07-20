import { NextResponse } from "next/server";
import type { PlanTier } from "@prisma/client";

/**
 * Single source of truth for which PlanTier unlocks which module. PlanTier is
 * the general feature-access tier (nav + route gating) and is intentionally
 * separate from AITier, which only governs AI token budget. See
 * prisma/schema.prisma for the PlanTier enum.
 */
export const PLAN_TIER_ORDER: PlanTier[] = ["FREE", "PRO", "PROFESSIONAL", "ENTERPRISE"];

const TIER_RANK: Record<PlanTier, number> = {
  FREE: 0,
  PRO: 1,
  PROFESSIONAL: 2,
  ENTERPRISE: 3,
};

export const PLAN_LABEL: Record<PlanTier, string> = {
  FREE: "Free",
  PRO: "Pro",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

/**
 * Every gated module in the app, mapped to the minimum PlanTier required.
 * Anything not listed here is treated as FREE (always allowed) by hasAccess.
 */
export const FEATURE_TIERS = {
  // FREE — daily-habit / core CRM tools that drive adoption
  "leads": "FREE",
  "properties": "FREE",
  "crm": "FREE",
  "showings": "FREE",
  "email-templates": "FREE",
  "mortgage-calculator": "FREE",
  "today-agenda": "FREE",
  "tasks": "FREE",

  // PRO — solo-agent productivity
  "open-houses": "PRO",
  "transactions": "PRO",
  "contracts": "PRO",
  "documents": "PRO",
  "file-storage": "PRO",
  "market-research": "PRO",
  "valuation": "PRO",
  "cma-pdf-export": "PRO",
  "listing-generator": "PRO",
  "showing-assistant": "PRO",
  "marketing": "PRO",
  "email-campaigns": "PRO",
  "reviews": "PRO",
  "reports": "PRO",
  "client-updates": "PRO",
  "sms-messaging": "PRO",
  "calendar-sync": "PRO",
  "commission-dashboard": "PRO",
  "push-notifications": "PRO",
  "voice-notes": "PRO",

  // PROFESSIONAL — team/brand-forward tools
  "zillow-bridge": "PROFESSIONAL",
  "property-matchmaker": "PROFESSIONAL",
  "social-scheduler": "PROFESSIONAL",
  "automations": "PROFESSIONAL",
  "connected-apps": "PROFESSIONAL",
  "map-view": "PROFESSIONAL",
  "business-card": "PROFESSIONAL",
  "client-portal": "PROFESSIONAL",
  "commission-splits": "PROFESSIONAL",
  "broker-dashboard": "PROFESSIONAL",

  // ENTERPRISE — brokerage-scale integration & data export
  "webhooks": "ENTERPRISE",
  "global-lead-intelligence": "ENTERPRISE",
} as const satisfies Record<string, PlanTier>;

export type FeatureKey = keyof typeof FEATURE_TIERS;

export function tierRequiredFor(feature: FeatureKey): PlanTier {
  return FEATURE_TIERS[feature];
}

export function hasAccess(userTier: PlanTier, feature: FeatureKey): boolean {
  const required = FEATURE_TIERS[feature];
  return TIER_RANK[userTier] >= TIER_RANK[required];
}

export function isTierAtLeast(userTier: PlanTier, minimum: PlanTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[minimum];
}

/** Throws a plain Error with a machine-checkable message; callers should catch and 403. */
export function requireTier(userTier: PlanTier, feature: FeatureKey): void {
  if (!hasAccess(userTier, feature)) {
    throw new EntitlementError(feature, FEATURE_TIERS[feature]);
  }
}

export class EntitlementError extends Error {
  readonly feature: FeatureKey;
  readonly requiredTier: PlanTier;

  constructor(feature: FeatureKey, requiredTier: PlanTier) {
    super(`This feature requires the ${PLAN_LABEL[requiredTier]} plan or higher.`);
    this.name = "EntitlementError";
    this.feature = feature;
    this.requiredTier = requiredTier;
  }
}

/**
 * Standard API-route gate: returns a 403 NextResponse if the user's tier is
 * too low, otherwise null (caller proceeds). Usage:
 *   const denied = requireTierResponse(user.planTier, "documents");
 *   if (denied) return denied;
 */
export function requireTierResponse(userTier: PlanTier, feature: FeatureKey): NextResponse | null {
  if (hasAccess(userTier, feature)) return null;
  const required = FEATURE_TIERS[feature];
  return NextResponse.json(
    {
      ok: false,
      error: `This feature requires the ${PLAN_LABEL[required]} plan or higher.`,
      code: "UPGRADE_REQUIRED",
      requiredTier: required,
    },
    { status: 403 },
  );
}
