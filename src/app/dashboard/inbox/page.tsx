import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import UpgradeGate from "@/components/UpgradeGate";

export const dynamic = "force-dynamic";

type ThreadSummary = {
  leadId: string;
  name: string;
  phone: string | null;
  preview: string;
  direction: string;
  createdAt: Date;
};

async function getThreads(userId: string): Promise<ThreadSummary[]> {
  const messages = await prisma.smsMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { lead: { select: { id: true, firstName: true, lastName: true, phone: true } } },
  });

  const seen = new Set<string>();
  const threads: ThreadSummary[] = [];
  for (const message of messages) {
    if (seen.has(message.leadId)) continue;
    seen.add(message.leadId);
    threads.push({
      leadId: message.leadId,
      name: `${message.lead.firstName} ${message.lead.lastName}`,
      phone: message.lead.phone,
      preview: message.body,
      direction: message.direction,
      createdAt: message.createdAt,
    });
  }
  return threads;
}

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UpgradeGate userTier={user.planTier} feature="sms-messaging" featureLabel="SMS Messaging">
      <InboxContent userId={user.id} />
    </UpgradeGate>
  );
}

async function InboxContent({ userId }: { userId: string }) {
  const threads = await getThreads(userId);

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-[#d8d1c2] pb-5">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]">
            <ArrowLeft size={16} aria-hidden="true" />
            Dashboard
          </Link>
          <h1 className="mt-3 flex items-center gap-2 text-3xl font-semibold">
            <MessageSquare size={26} className="text-[#17453b]" aria-hidden="true" />
            SMS Inbox
          </h1>
          <p className="mt-1 text-sm text-[#58665e]">Two-way text conversations with your leads.</p>
        </header>

        <section className="mt-6 overflow-hidden rounded-md border border-[#d8d1c2] bg-white">
          {threads.length === 0 ? (
            <p className="p-10 text-center text-sm text-[#58665e]">
              No conversations yet. Open a lead and send a text to start one.
            </p>
          ) : (
            <ul className="divide-y divide-[#e3dccf]">
              {threads.map((thread) => (
                <li key={thread.leadId}>
                  <Link
                    href={`/dashboard/inbox/${thread.leadId}`}
                    className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-[#fcfbf7]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{thread.name}</p>
                      <p className="truncate text-sm text-[#58665e]">
                        {thread.direction === "OUTBOUND" ? "You: " : ""}
                        {thread.preview}
                      </p>
                    </div>
                    <time
                      dateTime={thread.createdAt.toISOString()}
                      className="shrink-0 text-xs text-[#58665e]"
                    >
                      {thread.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
