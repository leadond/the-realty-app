import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mail, Phone, Plus, SlidersHorizontal } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import CallButton from "@/components/CallButton";

export const dynamic = "force-dynamic";

function money(value: number | null) {
  return value ? `$${value.toLocaleString()}` : "Open";
}

export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: { userId: user.id },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-[#d8d1c2] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">
              Lead pipeline
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/crm"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#b8ad99] bg-white px-3 text-sm font-semibold"
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Search &amp; Filter
            </Link>
            <Link
              href="/dashboard/crm"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#17453b] px-3 text-sm font-semibold text-white"
            >
              <Plus size={16} aria-hidden="true" />
              Add lead
            </Link>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-md border border-[#d8d1c2] bg-white">
          <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr] border-b border-[#e3dccf] bg-[#fcfbf7] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b4f2a] max-lg:hidden">
            <span>Client</span>
            <span>Target</span>
            <span>Budget</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-[#e3dccf]">
            {leads.map((lead) => (
              <article
                key={lead.id}
                className="grid gap-4 px-4 py-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr] lg:items-center"
              >
                <div>
                  <h2 className="font-semibold">
                    <Link href={`/dashboard/leads/${lead.id}`} className="hover:text-[#17453b] hover:underline">
                      {lead.firstName} {lead.lastName}
                    </Link>
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#58665e]">
                    {lead.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={14} aria-hidden="true" />
                        {lead.email}
                      </span>
                    )}
                    {lead.phone && (
                      <CallButton
                        leadId={lead.id}
                        phoneNumber={lead.phone}
                        contactName={`${lead.firstName} ${lead.lastName}`}
                        className="inline-flex items-center gap-1.5 text-[#365d52] hover:text-[#17453b] hover:underline"
                      />
                    )}
                  </div>
                </div>

                <div className="text-sm">
                  <p className="font-semibold">{lead.location ?? "Area open"}</p>
                  <p className="text-[#58665e]">
                    {lead.bedrooms ?? "Any"} bd / {lead.bathrooms ?? "Any"} ba
                  </p>
                </div>

                <div className="text-sm">
                  <p className="font-semibold">
                    {money(lead.budgetMin)} - {money(lead.budgetMax)}
                  </p>
                  <p className="text-[#58665e]">{lead.timeline ?? "Timeline open"}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-sm bg-[#e2eee8] px-2 py-1 text-xs font-semibold text-[#17453b]">
                    {lead.status.replace("_", " ")}
                  </span>
                  <span className="rounded-sm bg-[#f1eadc] px-2 py-1 text-xs font-semibold text-[#6b4f2a]">
                    {lead.priority}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
