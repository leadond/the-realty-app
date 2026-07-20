import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import UpgradeGate from "@/components/UpgradeGate";
import SmsThreadView from "@/components/SmsThreadView";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ leadId: string }> };

export default async function InboxThreadPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { leadId } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: user.id },
    select: { id: true },
  });
  if (!lead) notFound();

  return (
    <UpgradeGate userTier={user.planTier} feature="sms-messaging" featureLabel="SMS Messaging">
      <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/dashboard/inbox"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            All conversations
          </Link>
          <div className="mt-4 h-[70vh] overflow-hidden rounded-md border border-[#d8d1c2] bg-white">
            <SmsThreadView leadId={leadId} />
          </div>
        </div>
      </main>
    </UpgradeGate>
  );
}
