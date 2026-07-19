import { ShieldCheck } from "lucide-react";

import ModuleLandingPage from "@/components/ModuleLandingPage";

export default function SecurityPage() {
  return (
    <ModuleLandingPage
      title="Security"
      eyebrow="Access and controls"
      description="Manage account controls, connected apps, billing access, and sensitive integration setup from one security workspace."
      icon={ShieldCheck}
      primaryAction={{
        label: "Open settings",
        href: "/dashboard/settings",
        detail: "Manage billing and account-level controls.",
      }}
      stats={[
        { label: "Apps", value: "4" },
        { label: "Secrets", value: "Server" },
        { label: "Plan", value: "Active" },
      ]}
      actions={[
        {
          label: "Settings",
          href: "/dashboard/settings",
          detail: "Manage billing, account actions, and sensitive account settings.",
        },
        {
          label: "Connected apps",
          href: "/dashboard/integrations",
          detail: "Review app connections and import integrations.",
        },
        {
          label: "Broker dashboard",
          href: "/dashboard/broker",
          detail: "Manage team visibility and organization-level activity.",
        },
        {
          label: "Contracts",
          href: "/dashboard/contracts",
          detail: "Review signature workflows and document access paths.",
        },
      ]}
      focus={[
        "Keep API tokens and external app credentials server-side.",
        "Review connected apps before importing or syncing data.",
        "Keep billing and account controls separate from daily sales work.",
      ]}
    />
  );
}
