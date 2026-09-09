import Link from "next/link";
import { Lock } from "lucide-react";
import type { PlanTier, UserRole } from "@prisma/client";

import { hasAccess, tierRequiredFor, PLAN_LABEL, type FeatureKey } from "@/lib/entitlements";
import { getRoadmapFeature } from "@/lib/feature-roadmap";
import RequestAccessButton from "@/components/RequestAccessButton";

type UpgradeGateProps = {
  userTier: PlanTier;
  userRole?: UserRole | null;
  feature: FeatureKey;
  children: React.ReactNode;
  /** Short, human name of the module shown in the upgrade message, e.g. "Document Storage". */
  featureLabel: string;
};

/** Server component: renders children if the user's plan covers `feature`, otherwise an upgrade prompt. */
export default function UpgradeGate({ userTier, userRole, feature, children, featureLabel }: UpgradeGateProps) {
  const roadmapFeature = getRoadmapFeature(feature);
  if (roadmapFeature && userRole !== "ADMIN") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-5 py-16 text-[#17201b]">
        <div className="mx-auto max-w-lg rounded-md border border-[#d8d1c2] bg-white p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4d6]">
            <Lock className="h-6 w-6 text-[#7a551a]" aria-hidden="true" />
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b4f2a]">
              Request Access
            </p>
            <h1 className="mt-2 text-xl font-semibold">{roadmapFeature.label}</h1>
            <p className="mt-2 text-sm text-[#58665e]">{roadmapFeature.description}</p>
            <p className="mt-3 text-sm text-[#7a551a]">{roadmapFeature.reason}</p>
          </div>
          <div className="mt-6">
            <RequestAccessButton
              featureKey={roadmapFeature.key}
              featureLabel={roadmapFeature.label}
              initialRequested={false}
            />
          </div>
          <div className="mt-5 flex justify-center gap-3">
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
