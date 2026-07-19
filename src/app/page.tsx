import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Gauge,
  Home as HomeIcon,
  Inbox,
  KeyRound,
  MapPinned,
  Megaphone,
  MessageSquareText,
  PhoneCall,
  Radar,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { auth } from "@/lib/auth";

const metrics = [
  { label: "Active leads", value: "42", detail: "+8 this week" },
  { label: "Showings queued", value: "17", detail: "6 need briefings" },
  { label: "AI matches", value: "128", detail: "23 high-fit" },
  { label: "Follow-ups due", value: "9", detail: "3 urgent" },
];

const workstreams = [
  {
    title: "Lead Command",
    icon: Users,
    status: "Live",
    items: ["Inquiry triage", "Budget qualification", "Buyer timeline scoring"],
  },
  {
    title: "Showing Desk",
    icon: CalendarClock,
    status: "Ready",
    items: ["Route planning", "Showing notes", "Client reminders"],
  },
  {
    title: "Property Intelligence",
    icon: Building2,
    status: "Ready",
    items: ["Listing summaries", "Neighborhood snapshots", "Match explanations"],
  },
  {
    title: "Transaction Ops",
    icon: ClipboardCheck,
    status: "Draft",
    items: ["Checklist tracking", "Document readiness", "Deadline monitoring"],
  },
];

const modules = [
  { name: "Inbox", icon: Inbox, href: "/dashboard/crm" },
  { name: "Leads", icon: Users, href: "/dashboard/leads" },
  { name: "Properties", icon: HomeIcon, href: "/dashboard/properties" },
  { name: "Showings", icon: KeyRound, href: "/dashboard/showings" },
  { name: "Map", icon: MapPinned, href: "/dashboard/market-research" },
  { name: "Follow-ups", icon: PhoneCall, href: "/dashboard/automations" },
  { name: "AI matcher", icon: Sparkles, href: "/dashboard/matchmaker" },
  { name: "Briefings", icon: MessageSquareText, href: "/dashboard/showing-assistant" },
  { name: "Docs", icon: FileText, href: "/dashboard/documents" },
  { name: "Campaigns", icon: Megaphone, href: "/dashboard/email-campaigns" },
  { name: "Health", icon: Gauge, href: "/dashboard/reports" },
  { name: "Security", icon: ShieldCheck, href: "/dashboard/integrations" },
];

const recentActivity = [
  "Qualified new buyer lead for North Austin, $550k ceiling.",
  "Generated showing prep brief for 418 Redbud Trail.",
  "Flagged inspection contingency deadline due tomorrow.",
  "Prepared follow-up copy for two open house visitors.",
];

function moduleHref(href: string, isSignedIn: boolean) {
  if (isSignedIn) return href;

  return `/login?callbackUrl=${encodeURIComponent(href)}`;
}

export default async function Home() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user?.id);

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#17201b]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-[#d8d1c2] bg-[#fcfbf7] px-5 py-6 lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-[#17453b] text-white">
              <Bot size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#6b4f2a]">
                Local Ops
              </p>
              <h1 className="text-lg font-semibold">Realtor AI Assistant</h1>
            </div>
          </div>

          <nav className="mt-8 space-y-1" aria-label="Workspace modules">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.name}
                  href={moduleHref(module.href, isSignedIn)}
                  className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#34433b] transition hover:bg-[#ebe5d8] hover:text-[#17201b]"
                >
                  <Icon size={17} aria-hidden="true" />
                  {module.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1">
          <header className="border-b border-[#d8d1c2] bg-[#fcfbf7]/90 px-5 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-[#6b4f2a]">
                  Workspace: realtor-ai-assistant
                </p>
                <h2 className="text-2xl font-semibold tracking-normal">
                  Mission dashboard
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/api/leads"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-[#b8ad99] bg-white px-3 text-sm font-semibold"
                >
                  <Radar size={16} aria-hidden="true" />
                  API status
                </Link>
                <Link
                  href={moduleHref("/dashboard/leads", isSignedIn)}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[#17453b] px-3 text-sm font-semibold text-white"
                >
                  Open leads
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </header>

          <div className="px-5 py-6 md:px-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-md border border-[#d8d1c2] bg-white p-4"
                >
                  <p className="text-sm font-medium text-[#58665e]">
                    {metric.label}
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <span className="text-3xl font-semibold">
                      {metric.value}
                    </span>
                    <span className="text-sm text-[#8a5d24]">
                      {metric.detail}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-md border border-[#d8d1c2] bg-white">
                <div className="border-b border-[#e3dccf] px-5 py-4">
                  <h3 className="text-lg font-semibold">Agent workstreams</h3>
                </div>
                <div className="grid gap-0 md:grid-cols-2">
                  {workstreams.map((stream) => {
                    const Icon = stream.icon;
                    return (
                      <article
                        key={stream.title}
                        className="border-b border-[#e3dccf] p-5 even:md:border-l md:[&:nth-last-child(-n+2)]:border-b-0"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#e2eee8] text-[#17453b]">
                              <Icon size={18} aria-hidden="true" />
                            </div>
                            <h4 className="font-semibold">{stream.title}</h4>
                          </div>
                          <span className="rounded-sm bg-[#f1eadc] px-2 py-1 text-xs font-semibold text-[#6b4f2a]">
                            {stream.status}
                          </span>
                        </div>
                        <ul className="mt-4 space-y-2 text-sm text-[#58665e]">
                          {stream.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              </div>

              <aside className="rounded-md border border-[#d8d1c2] bg-white">
                <div className="border-b border-[#e3dccf] px-5 py-4">
                  <h3 className="text-lg font-semibold">Recent activity</h3>
                </div>
                <ol className="divide-y divide-[#e3dccf]">
                  {recentActivity.map((item) => (
                    <li key={item} className="px-5 py-4 text-sm text-[#34433b]">
                      {item}
                    </li>
                  ))}
                </ol>
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
