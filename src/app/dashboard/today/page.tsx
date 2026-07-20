import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckSquare, DoorOpen, Home } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const CLOSING_LOOKAHEAD_DAYS = 3;

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday(): Date {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function formatTime(value: Date): string {
  return value.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDate(value: Date): string {
  return value.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function propertyLabel(property: { address: string; city: string; state: string }): string {
  return `${property.address}, ${property.city}, ${property.state}`;
}

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const dayStart = startOfToday();
  const dayEnd = endOfToday();
  const closingCutoff = new Date(dayEnd);
  closingCutoff.setDate(closingCutoff.getDate() + CLOSING_LOOKAHEAD_DAYS);

  const [showings, openHouses, tasks, closings] = await Promise.all([
    prisma.showing.findMany({
      where: { userId: user.id, scheduledAt: { gte: dayStart, lte: dayEnd } },
      orderBy: { scheduledAt: "asc" },
      include: { property: true, lead: true },
    }),
    prisma.openHouse.findMany({
      where: { userId: user.id, startDate: { gte: dayStart, lte: dayEnd } },
      orderBy: { startDate: "asc" },
      include: { property: true },
    }),
    prisma.task.findMany({
      where: { userId: user.id, isCompleted: false, dueDate: { not: null, lte: dayEnd } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, closingDate: { gte: dayStart, lte: closingCutoff } },
      orderBy: { closingDate: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-[#d8d1c2] pb-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Today</h1>
          <p className="mt-1 text-sm text-[#58665e]">{formatDate(dayStart)} at a glance.</p>
        </header>

        <div className="mt-6 space-y-8">
          <AgendaSection
            title="Showings today"
            icon={<Home size={16} aria-hidden="true" />}
            emptyLabel="No showings scheduled for today."
            count={showings.length}
          >
            {showings.map((showing) => (
              <AgendaRow
                key={showing.id}
                primary={propertyLabel(showing.property)}
                secondary={
                  showing.lead
                    ? `${showing.lead.firstName} ${showing.lead.lastName}`
                    : "No lead attached"
                }
                meta={formatTime(showing.scheduledAt)}
              />
            ))}
          </AgendaSection>

          <AgendaSection
            title="Open houses today"
            icon={<DoorOpen size={16} aria-hidden="true" />}
            emptyLabel="No open houses today."
            count={openHouses.length}
          >
            {openHouses.map((openHouse) => (
              <AgendaRow
                key={openHouse.id}
                primary={propertyLabel(openHouse.property)}
                secondary={openHouse.status.replace("_", " ")}
                meta={`${formatTime(openHouse.startDate)} - ${formatTime(openHouse.endDate)}`}
              />
            ))}
          </AgendaSection>

          <AgendaSection
            title="Tasks due"
            icon={<CheckSquare size={16} aria-hidden="true" />}
            emptyLabel="No tasks due or overdue."
            count={tasks.length}
          >
            {tasks.map((task) => {
              const isOverdue = task.dueDate !== null && task.dueDate < dayStart;
              return (
                <AgendaRow
                  key={task.id}
                  primary={task.title}
                  secondary={task.notes ?? undefined}
                  meta={isOverdue ? "Overdue" : "Due today"}
                  metaTone={isOverdue ? "alert" : "default"}
                />
              );
            })}
          </AgendaSection>

          <AgendaSection
            title="Closings this week"
            icon={<CalendarClock size={16} aria-hidden="true" />}
            emptyLabel="No closings in the next few days."
            count={closings.length}
          >
            {closings.map((transaction) => (
              <AgendaRow
                key={transaction.id}
                primary={`${transaction.type.replace("_", " ")} closing`}
                secondary={transaction.status.replace("_", " ")}
                meta={transaction.closingDate ? formatDate(transaction.closingDate) : ""}
              />
            ))}
          </AgendaSection>
        </div>
      </div>
    </main>
  );
}

function AgendaSection({
  title,
  icon,
  emptyLabel,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  emptyLabel: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6b4f2a]">
        <span className="text-[#6b4f2a]">{icon}</span>
        {title}
        <span className="text-[#58665e]">({count})</span>
      </h2>
      <div className="mt-3 overflow-hidden rounded-md border border-[#d8d1c2] bg-white">
        {count === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[#58665e]">{emptyLabel}</p>
        ) : (
          <ul className="divide-y divide-[#e3dccf]">{children}</ul>
        )}
      </div>
    </section>
  );
}

function AgendaRow({
  primary,
  secondary,
  meta,
  metaTone = "default",
}: {
  primary: string;
  secondary?: string;
  meta: string;
  metaTone?: "default" | "alert";
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#17201b]">{primary}</p>
        {secondary && <p className="truncate text-sm text-[#58665e]">{secondary}</p>}
      </div>
      {meta && (
        <span
          className={`flex-none rounded-sm px-2 py-1 text-xs font-semibold ${
            metaTone === "alert"
              ? "bg-[#faf0eb] text-[#8a3a24]"
              : "bg-[#e2eee8] text-[#17453b]"
          }`}
        >
          {meta}
        </span>
      )}
    </li>
  );
}
