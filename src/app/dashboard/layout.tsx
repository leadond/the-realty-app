import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Calculator,
  CalendarClock,
  CheckSquare,
  CreditCard,
  Database,
  FileCheck,
  FileSignature,
  FileText,
  Home,
  HousePlus,
  IdCard,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Mic,
  Plug,
  Radio,
  Search,
  Send,
  Settings,
  Share2,
  Split,
  Star,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Webhook,
  Workflow,
} from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import SignOutButton from "@/components/SignOutButton";
import { hasAccess, tierRequiredFor, PLAN_LABEL, type FeatureKey } from "@/lib/entitlements";

const navItems: { icon: typeof Home; label: string; href: string; feature?: FeatureKey }[] = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: CalendarClock, label: "Today", href: "/dashboard/today", feature: "today-agenda" },
  { icon: CheckSquare, label: "Tasks", href: "/dashboard/tasks", feature: "tasks" },
  { icon: Users, label: "Lead Tracker", href: "/dashboard/leads" },
  { icon: Building2, label: "Properties", href: "/dashboard/properties" },
  { icon: Database, label: "CRM", href: "/dashboard/crm" },
  { icon: Calendar, label: "Showings", href: "/dashboard/showings" },
  { icon: HousePlus, label: "Open Houses", href: "/dashboard/open-houses", feature: "open-houses" },
  { icon: Briefcase, label: "Transactions", href: "/dashboard/transactions", feature: "transactions" },
  { icon: FileSignature, label: "Contracts", href: "/dashboard/contracts", feature: "contracts" },
  { icon: UserCheck, label: "Client Updates", href: "/dashboard/clients", feature: "client-updates" },
  { icon: UserCheck, label: "Client Portal Links", href: "/dashboard/portal-links", feature: "client-portal" },
  { icon: FileCheck, label: "Documents", href: "/dashboard/documents", feature: "documents" },
  { icon: Database, label: "File Storage", href: "/dashboard/files", feature: "file-storage" },
  { icon: MessageSquare, label: "SMS", href: "/dashboard/inbox", feature: "sms-messaging" },
  { icon: Search, label: "Market Research", href: "/dashboard/market-research", feature: "market-research" },
  { icon: Database, label: "Zillow / Bridge", href: "/dashboard/zillow-bridge", feature: "zillow-bridge" },
  { icon: TrendingUp, label: "Property Valuation", href: "/dashboard/valuation", feature: "valuation" },
  { icon: FileText, label: "Listing Generator", href: "/dashboard/listings", feature: "listing-generator" },
  { icon: Store, label: "Property Matchmaker", href: "/dashboard/matchmaker", feature: "property-matchmaker" },
  { icon: MapPin, label: "Showing Assistant", href: "/dashboard/showing-assistant", feature: "showing-assistant" },
  { icon: MapPin, label: "Map", href: "/dashboard/map", feature: "map-view" },
  { icon: Radio, label: "Marketing", href: "/dashboard/marketing", feature: "marketing" },
  { icon: Share2, label: "Social Scheduler", href: "/dashboard/social", feature: "social-scheduler" },
  { icon: Mail, label: "Email Templates", href: "/dashboard/email-templates" },
  { icon: Send, label: "Email Campaigns", href: "/dashboard/email-campaigns", feature: "email-campaigns" },
  { icon: Star, label: "Reviews", href: "/dashboard/reviews", feature: "reviews" },
  { icon: Workflow, label: "Automations", href: "/dashboard/automations", feature: "automations" },
  { icon: BarChart3, label: "Reports", href: "/dashboard/reports", feature: "reports" },
  { icon: CreditCard, label: "Commissions", href: "/dashboard/commissions", feature: "commission-dashboard" },
  { icon: Split, label: "Commission Splits", href: "/dashboard/commission-splits", feature: "commission-splits" },
  { icon: Calculator, label: "Mortgage Calc", href: "/dashboard/mortgage" },
  { icon: Mic, label: "Voice Notes", href: "/dashboard/voice-notes", feature: "voice-notes" },
  { icon: IdCard, label: "Business Card", href: "/dashboard/business-card", feature: "business-card" },
  { icon: Webhook, label: "Webhooks", href: "/dashboard/webhooks", feature: "webhooks" },
  { icon: Plug, label: "Connected Apps", href: "/dashboard/integrations", feature: "connected-apps" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = user.role === "BROKER"
    ? [...navItems, { icon: Briefcase, label: "Broker Dashboard", href: "/dashboard/broker", feature: "broker-dashboard" as FeatureKey }]
    : navItems;

  return (
    <div className="flex min-h-screen bg-[#f7f5ef] text-[#17201b]">
      <aside className="hidden w-72 shrink-0 border-r border-[#d8d1c2] bg-[#fcfbf7] lg:flex lg:flex-col">
        <div className="border-b border-[#d8d1c2] p-5">
          <h1 className="text-xl font-semibold">The Realty App</h1>
          <p className="mt-1 text-sm text-[#58665e] truncate">
            {user.organization?.name || user.name || user.email}
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Dashboard modules">
          {items.map((item) => {
            const locked = item.feature ? !hasAccess(user.planTier, item.feature) : false;
            return (
              <Link
                key={item.href}
                href={locked ? "/dashboard/settings" : item.href}
                className={`mb-1 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-[#ebe5d8] ${
                  locked ? "text-[#9a9284]" : "text-[#34433b]"
                }`}
                title={locked && item.feature ? `Requires ${PLAN_LABEL[tierRequiredFor(item.feature)]} plan` : undefined}
                aria-label={locked ? `${item.label} (locked, upgrade required)` : item.label}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#d8d1c2] p-3">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-[#d8d1c2] bg-[#fcfbf7] px-5 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <h1 className="font-semibold">The Realty App</h1>
            <Bell className="h-5 w-5 text-[#58665e]" aria-hidden="true" />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
