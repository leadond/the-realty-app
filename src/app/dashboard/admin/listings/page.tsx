import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Mail, TriangleAlert } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const STALE_ACTIVE_DAYS = 45;

function money(value: number) {
  return `$${value.toLocaleString()}`;
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AdminListingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organization: { select: { name: true } },
        },
      },
    },
  });

  const byAgent = new Map<
    string,
    { name: string | null; email: string; role: string; org: string | null; total: number; active: number; staleActive: number }
  >();

  for (const p of properties) {
    const key = p.user.id;
    const entry = byAgent.get(key) ?? {
      name: p.user.name,
      email: p.user.email,
      role: p.user.role,
      org: p.user.organization?.name ?? null,
      total: 0,
      active: 0,
      staleActive: 0,
    };
    entry.total += 1;
    if (p.status === "ACTIVE") {
      entry.active += 1;
      if (daysSince(p.updatedAt) >= STALE_ACTIVE_DAYS) entry.staleActive += 1;
    }
    byAgent.set(key, entry);
  }

  const agentRows = Array.from(byAgent.values()).sort((a, b) => b.staleActive - a.staleActive || b.total - a.total);
  const needsAttention = agentRows.filter((a) => a.staleActive > 0);

  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6b4f2a]">Platform operations</p>
        <h1 className="mt-1 text-3xl font-bold text-[#17201b]">All Listings</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#58665e]">
          Every property listing across every agent and brokerage on the platform, with the owning agent
          attached to each row. {properties.length} listing{properties.length === 1 ? "" : "s"} from {byAgent.size} agent
          {byAgent.size === 1 ? "" : "s"}.
        </p>
      </div>

      <section className="rounded-lg border border-[#d8d1c2] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <TriangleAlert className="h-5 w-5 text-[#9a6815]" />
          <h2 className="text-lg font-semibold">Agents by listing activity</h2>
        </div>
        <p className="mb-4 text-sm text-[#58665e]">
          Agents with active listings that haven&apos;t been updated in {STALE_ACTIVE_DAYS}+ days are flagged
          — a likely sign they need a check-in, help refreshing a listing, or an app question answered.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[#e3dccf] text-left text-xs font-semibold uppercase text-[#6b4f2a]">
                <th scope="col" className="pb-2 pr-4">Agent / Broker</th>
                <th scope="col" className="pb-2 pr-4">Brokerage</th>
                <th scope="col" className="pb-2 pr-4">Total listings</th>
                <th scope="col" className="pb-2 pr-4">Active</th>
                <th scope="col" className="pb-2 pr-4">Stale active (45+ days)</th>
                <th scope="col" className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eadc]">
              {agentRows.map((a) => (
                <tr key={a.email}>
                  <td className="py-2 pr-4">
                    <div className="font-semibold text-[#17201b]">{a.name || a.email}</div>
                    <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1 text-xs text-[#365d52] hover:underline">
                      <Mail className="h-3 w-3" aria-hidden="true" />
                      {a.email}
                    </a>
                  </td>
                  <td className="py-2 pr-4 text-[#58665e]">{a.org || "—"}</td>
                  <td className="py-2 pr-4">{a.total}</td>
                  <td className="py-2 pr-4">{a.active}</td>
                  <td className="py-2 pr-4">{a.staleActive}</td>
                  <td className="py-2">
                    {a.staleActive > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-2 py-1 text-xs font-semibold text-[#7a551a]">
                        <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                        Needs attention
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#e6f3e9] px-2 py-1 text-xs font-semibold text-[#28754b]">
                        On track
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {agentRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[#58665e]">No listings on the platform yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {needsAttention.length > 0 && (
          <p className="mt-3 text-xs text-[#7a551a]">{needsAttention.length} agent{needsAttention.length === 1 ? "" : "s"} flagged for stale active listings.</p>
        )}
      </section>

      <section className="rounded-lg border border-[#d8d1c2] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#17453b]" />
          <h2 className="text-lg font-semibold">Every listing</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-[#e3dccf] text-left text-xs font-semibold uppercase text-[#6b4f2a]">
                <th scope="col" className="pb-2 pr-4">Address</th>
                <th scope="col" className="pb-2 pr-4">Price</th>
                <th scope="col" className="pb-2 pr-4">Bed / Bath</th>
                <th scope="col" className="pb-2 pr-4">Status</th>
                <th scope="col" className="pb-2 pr-4">Agent / Broker</th>
                <th scope="col" className="pb-2">Listed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eadc]">
              {properties.map((p) => {
                const stale = p.status === "ACTIVE" && daysSince(p.updatedAt) >= STALE_ACTIVE_DAYS;
                return (
                  <tr key={p.id}>
                    <td className="py-2 pr-4">
                      <div className="font-medium text-[#17201b]">{p.address}</div>
                      <div className="text-xs text-[#58665e]">{p.city}, {p.state} {p.zip}</div>
                    </td>
                    <td className="py-2 pr-4">{money(p.price)}</td>
                    <td className="py-2 pr-4">{p.bedrooms} bd / {p.bathrooms} ba</td>
                    <td className="py-2 pr-4">
                      <span className="rounded-full bg-[#f1eadc] px-2 py-1 text-xs font-semibold text-[#6b4f2a]">
                        {p.status.replace("_", " ")}
                      </span>
                      {stale && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-2 py-1 text-xs font-semibold text-[#7a551a]">
                          <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                          Stale
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="font-medium text-[#17201b]">{p.user.name || p.user.email}</div>
                      <div className="text-xs text-[#58665e]">{p.user.organization?.name || p.user.role}</div>
                    </td>
                    <td className="py-2 text-[#58665e]">{p.createdAt.toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[#58665e]">No listings on the platform yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div>
        <Link href="/dashboard/admin" className="text-sm font-semibold text-[#365d52] hover:underline">
          Back to Backend Admin
        </Link>
      </div>
    </div>
  );
}
