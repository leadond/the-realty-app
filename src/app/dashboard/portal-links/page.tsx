import { redirect } from "next/navigation";
import { LinkIcon } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import UpgradeGate from "@/components/UpgradeGate";
import CopyLinkButton from "@/components/CopyLinkButton";

export default async function PortalLinksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, firstName: true, lastName: true, email: true, status: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  return (
    <UpgradeGate userTier={user.planTier} feature="client-portal" featureLabel="Client Portal Links">
      <main className="min-h-screen bg-[#f7f5ef] p-6 text-[#17201b]">
        <header className="mb-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <LinkIcon className="text-[#17453b]" aria-hidden="true" /> Client Portal Links
          </h1>
          <p className="mt-1 text-sm text-[#58665e]">
            Share a private, read-only portal with any client. Each link shows their showings,
            transaction status, and shared documents.
          </p>
        </header>

        {leads.length === 0 ? (
          <p className="rounded-md border border-[#d8d1c2] bg-white px-4 py-8 text-center text-sm text-[#58665e]">
            You don&apos;t have any contacts yet. Add a lead to generate a portal link.
          </p>
        ) : (
          <ul className="space-y-3">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d8d1c2] bg-white p-4"
              >
                <div className="text-sm">
                  <p className="font-semibold">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-[#58665e]">
                    {lead.email ?? "No email"} · {lead.status.replace(/_/g, " ")}
                  </p>
                </div>
                <CopyLinkButton value={`${baseUrl}/portal/${lead.id}`} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </UpgradeGate>
  );
}
