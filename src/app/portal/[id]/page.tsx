import { notFound } from "next/navigation";
import { Calendar, FileText, FileSignature, Home, MapPin } from "lucide-react";

import { prisma } from "@/lib/db";

function formatMoney(value: number | null): string {
  return value ? `$${value.toLocaleString()}` : "—";
}

export default async function ClientPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      showings: {
        include: { property: { select: { address: true, city: true, state: true } } },
        orderBy: { scheduledAt: "asc" },
      },
      contracts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  const transactions = await prisma.transaction.findMany({
    where: { leadId: lead.id, userId: lead.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, status: true, price: true, closingDate: true },
  });

  const txIds = transactions.map((t) => t.id);
  const docFilters: { transactionId?: { in: string[] }; sharedWith?: string }[] = [];
  if (txIds.length > 0) docFilters.push({ transactionId: { in: txIds } });
  if (lead.email) docFilters.push({ sharedWith: lead.email });

  const documents =
    docFilters.length > 0
      ? await prisma.document.findMany({
          where: { userId: lead.userId, isShared: true, OR: docFilters },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, type: true, url: true },
        })
      : [];

  const now = new Date();
  const upcoming = lead.showings.filter((s) => new Date(s.scheduledAt) >= now);
  const past = lead.showings.filter((s) => new Date(s.scheduledAt) < now);

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#17201b]">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="rounded-md border border-[#d8d1c2] bg-white p-6">
          <h1 className="text-2xl font-bold">Welcome, {lead.firstName}</h1>
          <p className="mt-1 text-sm text-[#58665e]">
            Here&apos;s an overview of your real estate journey with {lead.user.name ?? "your agent"}.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 border-t border-[#d8d1c2] pt-3 text-sm text-[#58665e]">
            {lead.user.email && <span>{lead.user.email}</span>}
            {lead.user.phone && <span>{lead.user.phone}</span>}
          </div>
        </header>

        <section className="rounded-md border border-[#d8d1c2] bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Calendar size={18} className="text-[#17453b]" aria-hidden="true" /> Showings
          </h2>
          {lead.showings.length === 0 ? (
            <p className="mt-2 text-sm text-[#58665e]">No showings scheduled yet.</p>
          ) : (
            <div className="mt-3 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#58665e]">Upcoming</h3>
                {upcoming.length === 0 ? (
                  <p className="mt-1 text-sm text-[#58665e]">Nothing scheduled right now.</p>
                ) : (
                  <ul className="mt-1 divide-y divide-[#d8d1c2]">
                    {upcoming.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{new Date(s.scheduledAt).toLocaleString()}</p>
                          {s.property && (
                            <p className="mt-0.5 flex items-center gap-1 text-[#58665e]">
                              <MapPin size={12} aria-hidden="true" /> {s.property.address},{" "}
                              {s.property.city}, {s.property.state}
                            </p>
                          )}
                        </div>
                        <span className="text-xs uppercase tracking-wide text-[#58665e]">
                          {s.status.replace(/_/g, " ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {past.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#58665e]">Past</h3>
                  <ul className="mt-1 divide-y divide-[#d8d1c2]">
                    {past.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{new Date(s.scheduledAt).toLocaleString()}</p>
                          {s.property && (
                            <p className="mt-0.5 flex items-center gap-1 text-[#58665e]">
                              <MapPin size={12} aria-hidden="true" /> {s.property.address},{" "}
                              {s.property.city}, {s.property.state}
                            </p>
                          )}
                        </div>
                        <span className="text-xs uppercase tracking-wide text-[#58665e]">
                          {s.status.replace(/_/g, " ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-md border border-[#d8d1c2] bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Home size={18} className="text-[#17453b]" aria-hidden="true" /> Transaction status
          </h2>
          {transactions.length === 0 ? (
            <p className="mt-2 text-sm text-[#58665e]">No active transactions yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#d8d1c2]">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{t.type.replace(/_/g, " ")}</p>
                    <p className="text-[#58665e]">
                      {formatMoney(t.price)}
                      {t.closingDate
                        ? ` · Closing ${new Date(t.closingDate).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#f1eadc] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[#6b4f2a]">
                    {t.status.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {lead.contracts.length > 0 && (
          <section className="rounded-md border border-[#d8d1c2] bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileSignature size={18} className="text-[#17453b]" aria-hidden="true" /> Contracts
            </h2>
            <ul className="mt-3 divide-y divide-[#d8d1c2]">
              {lead.contracts.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <p className="font-medium">{c.title}</p>
                  <span className="text-xs uppercase tracking-wide text-[#58665e]">
                    {c.status.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {documents.length > 0 && (
          <section className="rounded-md border border-[#d8d1c2] bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileText size={18} className="text-[#17453b]" aria-hidden="true" /> Shared documents
            </h2>
            <ul className="mt-3 divide-y divide-[#d8d1c2]">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-medium">{d.name}</span>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#17453b] hover:underline"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="pb-4 text-center text-xs text-[#58665e]">
          This is a private link shared with you by your agent.
        </p>
      </div>
    </main>
  );
}
