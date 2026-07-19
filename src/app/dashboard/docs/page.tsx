import { FileText } from "lucide-react";

import ModuleLandingPage from "@/components/ModuleLandingPage";

export default function DocsPage() {
  return (
    <ModuleLandingPage
      title="Docs"
      eyebrow="Document desk"
      description="Collect, prepare, and track documents across listings, contracts, transactions, and client work."
      icon={FileText}
      primaryAction={{
        label: "Open documents",
        href: "/dashboard/documents",
        detail: "Manage uploaded and shared files.",
      }}
      stats={[
        { label: "Files", value: "38" },
        { label: "Contracts", value: "7" },
        { label: "Shared", value: "12" },
      ]}
      actions={[
        {
          label: "Documents",
          href: "/dashboard/documents",
          detail: "Browse and organize files tied to properties and transactions.",
        },
        {
          label: "Contracts",
          href: "/dashboard/contracts",
          detail: "Prepare and manage client signature documents.",
        },
        {
          label: "Transactions",
          href: "/dashboard/transactions",
          detail: "Track closing milestones and document readiness.",
        },
        {
          label: "Client portal",
          href: "/dashboard/clients",
          detail: "See the client-facing context around shared materials.",
        },
      ]}
      focus={[
        "Keep documents tied to the transaction or property they support.",
        "Move from draft contract to signature without losing context.",
        "Monitor what is shared, pending, and ready.",
      ]}
    />
  );
}
