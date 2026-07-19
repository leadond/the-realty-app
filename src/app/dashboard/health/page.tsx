import { Gauge } from "lucide-react";

import ModuleLandingPage from "@/components/ModuleLandingPage";

export default function HealthPage() {
  return (
    <ModuleLandingPage
      title="Health"
      eyebrow="Business pulse"
      description="Monitor lead flow, conversion, showings, pipeline risk, and workload health before issues become surprises."
      icon={Gauge}
      primaryAction={{
        label: "Open reports",
        href: "/dashboard/reports",
        detail: "Review performance reporting and AI summaries.",
      }}
      stats={[
        { label: "Pipeline", value: "$2.4m" },
        { label: "Conversion", value: "18%" },
        { label: "Risk", value: "3" },
      ]}
      actions={[
        {
          label: "Reports",
          href: "/dashboard/reports",
          detail: "Analyze leads, showings, sources, and performance.",
        },
        {
          label: "Transactions",
          href: "/dashboard/transactions",
          detail: "Check closing dates, deal status, and transaction risk.",
        },
        {
          label: "Broker dashboard",
          href: "/dashboard/broker",
          detail: "Review team-wide performance when you manage an organization.",
        },
        {
          label: "Reviews",
          href: "/dashboard/reviews",
          detail: "Monitor reputation and client feedback signals.",
        },
      ]}
      focus={[
        "See the health of the business, not just individual records.",
        "Catch workload and pipeline risk early.",
        "Use reports to decide what needs attention next.",
      ]}
    />
  );
}
