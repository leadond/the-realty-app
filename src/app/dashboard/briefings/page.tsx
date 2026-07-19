import { MessageSquareText } from "lucide-react";

import ModuleLandingPage from "@/components/ModuleLandingPage";

export default function BriefingsPage() {
  return (
    <ModuleLandingPage
      title="Briefings"
      eyebrow="Prep room"
      description="Prepare for showings and client conversations with property context, talking points, and risk notes."
      icon={MessageSquareText}
      primaryAction={{
        label: "Open showing assistant",
        href: "/dashboard/showing-assistant",
        detail: "Generate a briefing for an upcoming showing.",
      }}
      stats={[
        { label: "Queued", value: "6" },
        { label: "Ready", value: "11" },
        { label: "Notes", value: "42" },
      ]}
      actions={[
        {
          label: "Showing assistant",
          href: "/dashboard/showing-assistant",
          detail: "Create AI prep notes for properties and clients.",
        },
        {
          label: "Showings",
          href: "/dashboard/showings",
          detail: "Review the schedule that needs prep.",
        },
        {
          label: "Market research",
          href: "/dashboard/market-research",
          detail: "Add neighborhood and comp context to conversations.",
        },
        {
          label: "Reports",
          href: "/dashboard/reports",
          detail: "Turn briefing signals into broader client summaries.",
        },
      ]}
      focus={[
        "Know the property story before the client asks.",
        "Surface objections and talking points early.",
        "Link each briefing back to the showing schedule.",
      ]}
    />
  );
}
