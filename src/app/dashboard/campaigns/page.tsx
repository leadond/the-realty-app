import { Megaphone } from "lucide-react";

import ModuleLandingPage from "@/components/ModuleLandingPage";

export default function CampaignsPage() {
  return (
    <ModuleLandingPage
      title="Campaigns"
      eyebrow="Marketing engine"
      description="Plan outreach across email, social, reviews, and listing promotion from one campaign workspace."
      icon={Megaphone}
      primaryAction={{
        label: "Open email campaigns",
        href: "/dashboard/email-campaigns",
        detail: "Create and schedule email campaigns.",
      }}
      stats={[
        { label: "Drafts", value: "5" },
        { label: "Scheduled", value: "4" },
        { label: "Posts", value: "16" },
      ]}
      actions={[
        {
          label: "Email campaigns",
          href: "/dashboard/email-campaigns",
          detail: "Build audience-targeted email outreach.",
        },
        {
          label: "Social scheduler",
          href: "/dashboard/social",
          detail: "Prepare and schedule listing and market social posts.",
        },
        {
          label: "Marketing copy",
          href: "/dashboard/marketing",
          detail: "Generate copy for listings, outreach, and promotions.",
        },
        {
          label: "Reviews",
          href: "/dashboard/reviews",
          detail: "Turn client proof into marketing assets.",
        },
      ]}
      focus={[
        "Coordinate campaigns across channels instead of one-off messages.",
        "Connect listings, audiences, and content in one workflow.",
        "Track what is drafted, scheduled, and published.",
      ]}
    />
  );
}
