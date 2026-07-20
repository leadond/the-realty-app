import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import UpgradeGate from "@/components/UpgradeGate";
import CommissionSplitForm, {
  type SplitGroup,
  type TransactionOption,
} from "@/components/CommissionSplitForm";
import { grossCommission } from "@/lib/commissions";

export const dynamic = "force-dynamic";

export default async function CommissionSplitsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UpgradeGate userTier={user.planTier} feature="commission-splits" featureLabel="Commission Splits">
      <CommissionSplitsView userId={user.id} />
    </UpgradeGate>
  );
}

async function CommissionSplitsView({ userId }: { userId: string }) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      commissionSplits: {
        orderBy: { createdAt: "asc" },
        include: { agent: { select: { name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
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

  const labelFor = (propertyId: string | null, id: string) => {
    const property = propertyId ? propertyById.get(propertyId) : undefined;
    if (property) return `${property.address}, ${property.city}, ${property.state}`;
    return `Transaction #${id.slice(0, 8)}`;
  };

  const transactionOptions: TransactionOption[] = transactions.map((tx) => ({
    id: tx.id,
    label: labelFor(tx.propertyId, tx.id),
  }));

  const groups: SplitGroup[] = transactions
    .filter((tx) => tx.commissionSplits.length > 0)
    .map((tx) => ({
      transactionId: tx.id,
      label: labelFor(tx.propertyId, tx.id),
      gross: grossCommission(tx),
      splits: tx.commissionSplits.map((split) => ({
        id: split.id,
        role: split.role,
        splitPercent: split.splitPercent,
        splitAmount: split.splitAmount,
        notes: split.notes,
        agentName: split.agent.name ?? split.agent.email,
      })),
    }));

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-[#d8d1c2] pb-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]">
            <ArrowLeft size={16} aria-hidden="true" />
            Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Commission splits</h1>
          <p className="mt-1 text-sm text-[#58665e]">
            Divide commission with referral and co-broke partners on your transactions.
          </p>
        </header>

        <div className="mt-6">
          <CommissionSplitForm transactions={transactionOptions} groups={groups} />
        </div>
      </div>
    </main>
  );
}
