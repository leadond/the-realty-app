import { Sparkles } from "lucide-react";

import ModuleLandingPage from "@/components/ModuleLandingPage";

export default function AiMatcherPage() {
  return (
    <ModuleLandingPage
      title="AI Matcher"
      eyebrow="Property fit"
      description="Turn buyer requirements into ranked property recommendations with clear match reasoning."
      icon={Sparkles}
      primaryAction={{
        label: "Open property matchmaker",
        href: "/dashboard/matchmaker",
        detail: "Generate property matches from client criteria.",
      }}
      stats={[
        { label: "Matches", value: "128" },
        { label: "High fit", value: "23" },
        { label: "Saved", value: "14" },
      ]}
      actions={[
        {
          label: "Property matchmaker",
          href: "/dashboard/matchmaker",
          detail: "Rank listings against budget, location, beds, baths, and must-haves.",
        },
        {
          label: "Client portal",
          href: "/dashboard/clients",
          detail: "Review client preferences and active buyer needs.",
        },
        {
          label: "Properties",
          href: "/dashboard/properties",
          detail: "Maintain the listings that matcher can recommend.",
        },
        {
          label: "Listing generator",
          href: "/dashboard/listings",
          detail: "Turn a matched property into client-ready listing copy.",
        },
      ]}
      focus={[
        "Explain why a home fits, not just that it fits.",
        "Keep requirements and listings connected.",
        "Move from match discovery into client-ready communication.",
      ]}
    />
  );
}
