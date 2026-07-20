import Link from "next/link";
import { Lock } from "lucide-react";
import type { PlanTier } from "@prisma/client";

import { hasAccess, tierRequiredFor, PLAN_LABEL, type FeatureKey } from "@/lib/entitlements";

type UpgradeGateProps = {
  userTier: PlanTier;
  feature: FeatureKey;
  children: React.ReactNode;
  /** Short, human name of the module shown in the upgrade message, e.g. "Document Storage". */
  featureLabel: string;
};

/** Server component: renders children if the user's plan covers `feature`, otherwise an upgrade prompt. */
export default function UpgradeGate({ userTier, feature, children, featureLabel }: UpgradeGateProps) {
  if (hasAccess(userTier, feature)) return <>{children}</>;

  const requiredTier = tierRequiredFor(feature);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-5 py-16 text-[#17201b]">
      <div className="mx-auto max-w-md rounded-md border border-[#d8d1c2] bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1eadc]">
          <Lock className="h-6 w-6 text-[#6b4f2a]" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{featureLabel} is a {PLAN_LABEL[requiredTier]} feature</h1>
        <p className="mt-2 text-sm text-[#58665e]">
          Upgrade your plan to unlock {featureLabel.toLowerCase()} and the rest of the{" "}
          {PLAN_LABEL[requiredTier]} tier.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard/settings"
            className="inline-flex h-10 items-center rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white"
          >
            View plans
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-md border border-[#b8ad99] bg-white px-4 text-sm font-semibold"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
