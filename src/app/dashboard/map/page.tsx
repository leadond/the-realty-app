import { MapPinned } from "lucide-react";

import ModuleLandingPage from "@/components/ModuleLandingPage";

export default function MapPage() {
  return (
    <ModuleLandingPage
      title="Map"
      eyebrow="Location intelligence"
      description="Work from location first: neighborhoods, comparable properties, showing geography, and client search areas."
      icon={MapPinned}
      primaryAction={{
        label: "Open market map research",
        href: "/dashboard/market-research",
        detail: "Generate neighborhood and comparable market context.",
      }}
      stats={[
        { label: "Areas", value: "8" },
        { label: "Comps", value: "24" },
        { label: "Routes", value: "5" },
      ]}
      actions={[
        {
          label: "Market research",
          href: "/dashboard/market-research",
          detail: "Build a local read on pricing, schools, amenities, and demand.",
        },
        {
          label: "Properties",
          href: "/dashboard/properties",
          detail: "Review saved listings by city, state, ZIP, and property profile.",
        },
        {
          label: "Showing assistant",
          href: "/dashboard/showing-assistant",
          detail: "Prepare route-aware context before client tours.",
        },
        {
          label: "Zillow / Bridge",
          href: "/dashboard/zillow-bridge",
          detail: "Query Bridge datasets, Zestimates, public records, and econ data.",
        },
        {
          label: "Property valuation",
          href: "/dashboard/valuation",
          detail: "Estimate value with property and local market signals.",
        },
      ]}
      focus={[
        "Start with geography before jumping into individual records.",
        "Connect listings, comps, and showing plans in one place.",
        "Use market context to explain tradeoffs to clients.",
      ]}
    />
  );
}
