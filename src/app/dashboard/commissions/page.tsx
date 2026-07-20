import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TrendingUp, Wallet, Users } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import UpgradeGate from "@/components/UpgradeGate";
import {
  grossCommission,
  netCommission,
  totalSplitDeduction,
} from "@/lib/commissions";

export const dynamic = "force-dynamic";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export default async function CommissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UpgradeGate
      userTier={user.planTier}
      feature="commission-dashboard"
      featureLabel="Commission Dashboard"
    >
      <CommissionsDashboard userId={user.id} />
    </UpgradeGate>
  );
}

async function CommissionsDashboard({ userId }: { userId: string }) {
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: { commissionSplits: true },
    orderBy: { closingDate: "asc" },
  });

  const propertyIds = Array.from(
    new Set(transactions.map((tx) => tx.propertyId).filter((id): id is string => Boolean(id))),
  );
  const properties = propertyIds.length
    ? await prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true, address: true, city: true, state: true },
      })
    : [];
  const propertyById = new Map(properties.map((p) => [p.id, p]));

  const propertyLabel = (propertyId: string | null) => {
    if (!propertyId) return "Untitled transaction";
    const property = propertyById.get(propertyId);
    if (!property) return "Untitled transaction";
    return `${property.address}, ${property.city}, ${property.state}`;
  };

  const closedThisYear = transactions.filter(
    (tx) =>
      tx.status === "CLOSED" &&
      tx.closingDate != null &&
      tx.closingDate >= yearStart &&
      tx.closingDate < yearEnd,
  );

  const projected = transactions.filter(
    (tx) =>
      tx.status !== "CLOSED" &&
      tx.status !== "CANCELLED" &&
      tx.status !== "FALLING_THROUGH" &&
      grossCommission(tx) > 0,
  );

  const totalGross = closedThisYear.reduce((sum, tx) => sum + grossCommission(tx), 0);
  const totalSplits = closedThisYear.reduce(
    (sum, tx) => sum + totalSplitDeduction(tx.commissionSplits, grossCommission(tx)),
    0,
  );
  const totalNet = totalGross - totalSplits;
  const projectedGross = projected.reduce((sum, tx) => sum + grossCommission(tx), 0);

  const monthlyRows = MONTHS.map((label, index) => {
    const rows = closedThisYear.filter((tx) => tx.closingDate!.getMonth() === index);
    const gross = rows.reduce((sum, tx) => sum + grossCommission(tx), 0);
    const splits = rows.reduce(
      (sum, tx) => sum + totalSplitDeduction(tx.commissionSplits, grossCommission(tx)),
      0,
    );
    return { label, count: rows.length, gross, splits, net: gross - splits };
  });

  const summaryCards = [
    {
      label: `Gross commission (${year})`,
      value: money(totalGross),
      icon: TrendingUp,
      hint: `${closedThisYear.length} closed transaction${closedThisYear.length === 1 ? "" : "s"}`,
    },
    {
      label: "Split to other agents",
      value: money(totalSplits),
      icon: Users,
      hint: "Referral & co-broke owed",
    },
    {
      label: "Net commission",
      value: money(totalNet),
      icon: Wallet,
      hint: "After splits deducted",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-[#d8d1c2] pb-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]">
            <ArrowLeft size={16} aria-hidden="true" />
            Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Commission dashboard</h1>
          <p className="mt-1 text-sm text-[#58665e]">
            Your earned and projected commission for {year}.
          </p>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-md border border-[#d8d1c2] bg-white p-5">
              <div className="flex items-center gap-2 text-[#365d52]">
                <card.icon size={18} aria-hidden="true" />
                <span className="text-sm font-semibold">{card.label}</span>
              </div>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              <p className="mt-1 text-sm text-[#58665e]">{card.hint}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 rounded-md border border-[#d8d1c2] bg-[#f1eadc] p-5">
          <p className="text-sm font-semibold text-[#6b4f2a]">Projected pipeline commission (estimate)</p>
          <p className="mt-2 text-2xl font-semibold text-[#6b4f2a]">{money(projectedGross)}</p>
          <p className="mt-1 text-sm text-[#6b4f2a]">
            Gross estimate across {projected.length} open transaction
            {projected.length === 1 ? "" : "s"} not yet closed. Not counted in earned totals above.
          </p>
        </section>

        <section className="mt-6 overflow-hidden rounded-md border border-[#d8d1c2] bg-white">
          <div className="border-b border-[#e3dccf] bg-[#fcfbf7] px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b4f2a]">
              Monthly breakdown ({year})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e3dccf] text-left text-xs uppercase tracking-wide text-[#58665e]">
                  <th scope="col" className="px-4 py-3 font-semibold">Month</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Closed</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Gross</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Splits</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3dccf]">
                {monthlyRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="px-4 py-3 text-left font-normal">{row.label}</th>
                    <td className="px-4 py-3 text-right">{row.count}</td>
                    <td className="px-4 py-3 text-right">{money(row.gross)}</td>
                    <td className="px-4 py-3 text-right text-[#58665e]">{money(row.splits)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(row.net)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#d8d1c2] bg-[#fcfbf7] font-semibold">
                  <th scope="row" className="px-4 py-3 text-left">Total</th>
                  <td className="px-4 py-3 text-right">{closedThisYear.length}</td>
                  <td className="px-4 py-3 text-right">{money(totalGross)}</td>
                  <td className="px-4 py-3 text-right">{money(totalSplits)}</td>
                  <td className="px-4 py-3 text-right">{money(totalNet)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-md border border-[#d8d1c2] bg-white">
          <div className="border-b border-[#e3dccf] bg-[#fcfbf7] px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b4f2a]">
              Closed transactions ({year})
            </h2>
          </div>
          {closedThisYear.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#58665e]">
              No closed transactions with a closing date in {year} yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e3dccf] text-left text-xs uppercase tracking-wide text-[#58665e]">
                    <th scope="col" className="px-4 py-3 font-semibold">Property</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Closed</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Gross</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Splits</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3dccf]">
                  {closedThisYear.map((tx) => {
                    const gross = grossCommission(tx);
                    const splits = totalSplitDeduction(tx.commissionSplits, gross);
                    return (
                      <tr key={tx.id}>
                        <th scope="row" className="px-4 py-3 text-left font-normal">
                          {propertyLabel(tx.propertyId)}
                        </th>
                        <td className="px-4 py-3 text-[#58665e]">
                          {tx.closingDate!.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">{money(gross)}</td>
                        <td className="px-4 py-3 text-right text-[#58665e]">{money(splits)}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {money(netCommission(tx, tx.commissionSplits))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
