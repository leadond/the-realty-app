import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarClock } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { generateCalendarToken } from "@/lib/calendar-token";
import UpgradeGate from "@/components/UpgradeGate";
import CopyLinkButton from "@/components/CopyLinkButton";

export const dynamic = "force-dynamic";

export default async function CalendarSyncPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UpgradeGate userTier={user.planTier} feature="calendar-sync" featureLabel="Calendar Sync">
      <CalendarSyncContent userId={user.id} />
    </UpgradeGate>
  );
}

function CalendarSyncContent({ userId }: { userId: string }) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const token = generateCalendarToken(userId);
  const feedUrl = `${baseUrl}/api/calendar/${userId}?token=${token}`;

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
      <div className="mx-auto max-w-2xl">
        <header className="border-b border-[#d8d1c2] pb-5">
          <Link href="/dashboard/showings" className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]">
            <ArrowLeft size={16} aria-hidden="true" />
            Showings
          </Link>
          <h1 className="mt-3 flex items-center gap-2 text-3xl font-semibold">
            <CalendarClock size={26} className="text-[#17453b]" aria-hidden="true" />
            Calendar Sync
          </h1>
          <p className="mt-1 text-sm text-[#58665e]">
            Subscribe to a live feed of your showings, open houses, and transaction closings.
          </p>
        </header>

        <section className="mt-6 rounded-md border border-[#d8d1c2] bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b4f2a]">
            Your calendar subscription URL
          </h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="calendar-feed-url" className="sr-only">
              Calendar subscription URL
            </label>
            <input
              id="calendar-feed-url"
              type="text"
              readOnly
              value={feedUrl}
              className="min-w-0 flex-1 rounded-md border border-[#d8d1c2] bg-[#fcfbf7] px-3 py-2 font-mono text-xs text-[#17201b]"
            />
            <CopyLinkButton value={feedUrl} />
          </div>
          <p className="mt-3 text-xs text-[#58665e]">
            Treat this link like a password — anyone with it can view your calendar. It updates
            automatically as your schedule changes.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-[#d8d1c2] bg-white p-6 text-sm text-[#17201b]">
          <h2 className="font-semibold">How to subscribe</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[#58665e]">
            <li>
              <span className="font-semibold text-[#17201b]">Google Calendar:</span> Other calendars
              → From URL → paste the link above.
            </li>
            <li>
              <span className="font-semibold text-[#17201b]">Apple Calendar:</span> File → New
              Calendar Subscription → paste the link.
            </li>
            <li>
              <span className="font-semibold text-[#17201b]">Outlook:</span> Add calendar →
              Subscribe from web → paste the link.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
