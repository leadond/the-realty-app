import { PhoneCall } from "lucide-react";

import ModuleLandingPage from "@/components/ModuleLandingPage";

export default function FollowUpsPage() {
  return (
    <ModuleLandingPage
      title="Follow-ups"
      eyebrow="Client cadence"
      description="Keep every lead and client conversation moving with reminders, campaigns, and repeatable outreach."
      icon={PhoneCall}
      primaryAction={{
        label: "Open follow-up automation",
        href: "/dashboard/automations",
        detail: "Create rules and reminders for lead follow-up.",
      }}
      stats={[
        { label: "Due", value: "9" },
        { label: "Urgent", value: "3" },
        { label: "Rules", value: "6" },
      ]}
      actions={[
        {
          label: "Automation rules",
          href: "/dashboard/automations",
          detail: "Trigger reminders and outreach based on lead activity.",
        },
        {
          label: "Email campaigns",
          href: "/dashboard/email-campaigns",
          detail: "Schedule grouped outreach for lead and client segments.",
        },
        {
          label: "Email templates",
          href: "/dashboard/email-templates",
          detail: "Draft reusable follow-up messages for common moments.",
        },
        {
          label: "Lead tracker",
          href: "/dashboard/leads",
          detail: "Update lead status after each touchpoint.",
        },
      ]}
      focus={[
        "Make next steps visible before leads go cold.",
        "Tie reminders to lead status and showing activity.",
        "Use consistent messaging without losing the personal touch.",
      ]}
    />
  );
}
