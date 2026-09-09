import type { FeatureKey } from "@/lib/entitlements";

export type RoadmapFeature = {
  key: FeatureKey;
  label: string;
  group: "Workday" | "Listings" | "Deals" | "Marketing" | "Admin";
  description: string;
  reason: string;
};

export const REQUEST_ACCESS_FEATURES = [
  {
    key: "sms-messaging",
    label: "Two-Way SMS",
    group: "Workday",
    description: "Text leads and clients from inside The Realty App with message history and follow-up context.",
    reason: "This needs phone-number provisioning and delivery compliance before it should be broadly enabled.",
  },
  {
    key: "zillow-bridge",
    label: "Live MLS / Bridge Data",
    group: "Listings",
    description: "Search live listing data, enrich properties, and save matching homes into an agent workspace.",
    reason: "Bridge access depends on approved datasets and MLS rules, so we are collecting demand by market.",
  },
  {
    key: "file-storage",
    label: "File Vault",
    group: "Deals",
    description: "Upload transaction files, disclosures, listing media, and client documents.",
    reason: "Storage needs production file hosting and retention policies before broad rollout.",
  },
  {
    key: "email-campaigns",
    label: "Email Campaign Sending",
    group: "Marketing",
    description: "Send segmented nurture campaigns and listing announcements from saved templates.",
    reason: "Sending requires a verified email provider and deliverability setup.",
  },
  {
    key: "social-scheduler",
    label: "Social Auto-Publishing",
    group: "Marketing",
    description: "Schedule and publish approved posts directly to connected social accounts.",
    reason: "Direct publishing requires platform OAuth approvals. Manual drafting remains available.",
  },
  {
    key: "connected-apps",
    label: "Third-Party App OAuth",
    group: "Admin",
    description: "Let each agent connect tools like DocuSign, Meta, TikTok, LinkedIn, and future CRMs.",
    reason: "Each provider needs its own production OAuth app, scopes, and callback review.",
  },
  {
    key: "webhooks",
    label: "Webhook Exports",
    group: "Admin",
    description: "Send lead, showing, contract, and transaction events to external systems.",
    reason: "Webhook subscriptions need admin controls, audit trails, and delivery monitoring.",
  },
] as const satisfies readonly RoadmapFeature[];

export type RequestAccessFeatureKey = (typeof REQUEST_ACCESS_FEATURES)[number]["key"];

export function getRoadmapFeature(key: string | null | undefined): RoadmapFeature | null {
  return REQUEST_ACCESS_FEATURES.find((feature) => feature.key === key) ?? null;
}

export function isRequestAccessFeature(key: string | null | undefined): key is RequestAccessFeatureKey {
  return Boolean(getRoadmapFeature(key));
}
