import { Inbox } from "lucide-react";

import ModuleLandingPage from "@/components/ModuleLandingPage";

export default function InboxPage() {
  return (
    <ModuleLandingPage
      title="Inbox"
      eyebrow="Lead intake"
      description="Review new inquiries, imported contacts, and lead activity before they become active client work."
      icon={Inbox}
      primaryAction={{
        label: "Open CRM inbox",
        href: "/dashboard/crm",
        detail: "Review incoming contacts and imported lead records.",
      }}
      stats={[
        { label: "New", value: "12" },
        { label: "Waiting", value: "7" },
        { label: "Imported", value: "31" },
      ]}
      actions={[
        {
          label: "Lead tracker",
          href: "/dashboard/leads",
          detail: "Move qualified contacts into your active lead pipeline.",
        },
        {
          label: "CSV import",
          href: "/dashboard/integrations",
          detail: "Bring in a contact list and map fields into lead records.",
        },
        {
          label: "Email templates",
          href: "/dashboard/email-templates",
          detail: "Prepare first-response copy for new inquiries.",
        },
        {
          label: "Follow-up rules",
          href: "/dashboard/follow-ups",
          detail: "Set the reminders and automation that keep inbox items moving.",
        },
      ]}
      focus={[
        "Separate raw inquiries from qualified leads.",
        "Spot contacts that need a fast first response.",
        "Route imported contacts into the right next workflow.",
      ]}
    />
  );
}
