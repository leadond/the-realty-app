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
  ChevronDown,
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
  ShieldCheck,
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
import RealtyLogo from "@/components/RealtyLogo";
import { hasAccess, tierRequiredFor, PLAN_LABEL, type FeatureKey } from "@/lib/entitlements";
import { getRoadmapFeature, isRequestAccessFeature } from "@/lib/feature-roadmap";

type NavItem = { icon: typeof Home; label: string; href: string; feature?: FeatureKey };
type NavSection = { icon: typeof Home; label: string; defaultOpen?: boolean; items: NavItem[] };

const primaryNavItem: NavItem = { icon: Home, label: "Dashboard", href: "/dashboard" };

const navSections: NavSection[] = [
  {
    icon: CalendarClock,
    label: "Workday",
    defaultOpen: true,
    items: [
      { icon: CalendarClock, label: "Today", href: "/dashboard/today", feature: "today-agenda" },
      { icon: CheckSquare, label: "Tasks", href: "/dashboard/tasks", feature: "tasks" },
      { icon: MessageSquare, label: "Inbox & SMS", href: "/dashboard/inbox", feature: "sms-messaging" },
      { icon: Calendar, label: "Showings", href: "/dashboard/showings" },
      { icon: Mic, label: "Voice Notes", href: "/dashboard/voice-notes", feature: "voice-notes" },
    ],
  },
  {
    icon: Users,
    label: "Clients",
    defaultOpen: true,
    items: [
      { icon: Users, label: "Leads & CRM", href: "/dashboard/leads" },
      { icon: Database, label: "Import / Export", href: "/dashboard/crm" },
      { icon: UserCheck, label: "Client Updates", href: "/dashboard/clients", feature: "client-updates" },
      { icon: UserCheck, label: "Portal Links", href: "/dashboard/portal-links", feature: "client-portal" },
    ],
  },
  {
    icon: Building2,
    label: "Listings",
    items: [
      { icon: Building2, label: "Properties", href: "/dashboard/properties" },
      { icon: HousePlus, label: "Open Houses", href: "/dashboard/open-houses", feature: "open-houses" },
      { icon: MapPin, label: "Map View", href: "/dashboard/map", feature: "map-view" },
      { icon: Database, label: "Zillow / Bridge", href: "/dashboard/zillow-bridge", feature: "zillow-bridge" },
      { icon: Search, label: "Market Research", href: "/dashboard/market-research", feature: "market-research" },
      { icon: TrendingUp, label: "Valuation", href: "/dashboard/valuation", feature: "valuation" },
      { icon: Store, label: "AI Matchmaker", href: "/dashboard/matchmaker", feature: "property-matchmaker" },
      { icon: FileText, label: "Listing Copy", href: "/dashboard/listings", feature: "listing-generator" },
      { icon: Calculator, label: "Mortgage Calc", href: "/dashboard/mortgage" },
    ],
  },
  {
    icon: Briefcase,
    label: "Deals",
    items: [
      { icon: Briefcase, label: "Transactions", href: "/dashboard/transactions", feature: "transactions" },
      { icon: FileSignature, label: "Contracts", href: "/dashboard/contracts", feature: "contracts" },
      { icon: FileCheck, label: "Forms & Flyers", href: "/dashboard/documents", feature: "documents" },
      { icon: Database, label: "File Vault", href: "/dashboard/files", feature: "file-storage" },
      { icon: CreditCard, label: "Commission Dashboard", href: "/dashboard/commissions", feature: "commission-dashboard" },
      { icon: Split, label: "Commission Splits", href: "/dashboard/commission-splits", feature: "commission-splits" },
    ],
  },
  {
    icon: Radio,
    label: "Marketing",
    items: [
      { icon: Radio, label: "Marketing Studio", href: "/dashboard/marketing", feature: "marketing" },
      { icon: Send, label: "Email Campaigns", href: "/dashboard/email-campaigns", feature: "email-campaigns" },
      { icon: Mail, label: "Email Templates", href: "/dashboard/email-templates" },
      { icon: Share2, label: "Social Scheduler", href: "/dashboard/social", feature: "social-scheduler" },
      { icon: Star, label: "Reviews", href: "/dashboard/reviews", feature: "reviews" },
      { icon: IdCard, label: "Business Card", href: "/dashboard/business-card", feature: "business-card" },
    ],
  },
  {
    icon: Settings,
    label: "Admin",
    items: [
      { icon: Workflow, label: "Automations", href: "/dashboard/automations", feature: "automations" },
      { icon: BarChart3, label: "Reports", href: "/dashboard/reports", feature: "reports" },
      { icon: Bell, label: "Feature Requests", href: "/dashboard/requests" },
      { icon: Plug, label: "Connected Apps", href: "/dashboard/integrations", feature: "connected-apps" },
      { icon: Webhook, label: "Webhooks", href: "/dashboard/webhooks", feature: "webhooks" },
      { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ],
  },
];

const brokerNavItem: NavItem = {
  icon: Briefcase,
  label: "Broker Dashboard",
  href: "/dashboard/broker",
  feature: "broker-dashboard",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const canOpenBrokerDashboard = user.role === "BROKER" || user.role === "ADMIN";
  const canPreviewFutureFeatures = user.role === "ADMIN";
  const sections = canOpenBrokerDashboard
    ? navSections.map((section) =>
        section.label === "Admin" ? { ...section, items: [...section.items, brokerNavItem] } : section,
      )
    : navSections;
  const visibleSections = user.role === "ADMIN"
    ? sections.map((section) => section.label === "Admin"
      ? {
          ...section,
          items: [
            ...section.items,
            { icon: Building2, label: "All Listings", href: "/dashboard/admin/listings" },
            { icon: ShieldCheck, label: "Backend Admin", href: "/dashboard/admin" },
          ],
        }
      : section)
    : sections;
  const PrimaryIcon = primaryNavItem.icon;

  return (
    <div className="flex min-h-screen bg-[#f7f5ef] text-[#17201b]">
      <aside className="hidden w-72 shrink-0 border-r border-[#d8d1c2] bg-[#fcfbf7] lg:flex lg:flex-col">
        <div className="border-b border-[#d8d1c2] p-5">
          <RealtyLogo size="sm" />
          <p className="mt-1 text-sm text-[#58665e] truncate">
            {user.organization?.name || user.name || user.email}
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Dashboard modules">
          <Link
            href={primaryNavItem.href}
            className="mb-3 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-[#17201b] hover:bg-[#ebe5d8]"
          >
            <PrimaryIcon className="h-5 w-5" aria-hidden="true" />
            <span>{primaryNavItem.label}</span>
          </Link>

          <div className="space-y-2">
            {visibleSections.map((section) => (
              <details key={section.label} open={section.defaultOpen} className="group rounded-md">
                <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md px-3 text-xs font-semibold uppercase text-[#6b4f2a] hover:bg-[#ebe5d8] [&::-webkit-details-marker]:hidden">
                  <section.icon className="h-4 w-4" aria-hidden="true" />
                  <span className="flex-1">{section.label}</span>
                  <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-1 space-y-1 pl-2">
                  {section.items.map((item) => {
                    const requestOnly = Boolean(
                      item.feature && !canPreviewFutureFeatures && isRequestAccessFeature(item.feature),
                    );
                    const locked = !requestOnly && item.feature ? !hasAccess(user.planTier, item.feature) : false;
                    const requiredTier = item.feature ? tierRequiredFor(item.feature) : null;
                    const roadmapFeature = item.feature ? getRoadmapFeature(item.feature) : null;
                    const href = requestOnly
                      ? `/dashboard/request-access?feature=${item.feature}`
                      : locked && item.feature
                        ? `/dashboard/settings?request=${item.feature}`
                        : item.href;
                    return (
                      <Link
                        key={item.href}
                        href={href}
                        className={`flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                          requestOnly || locked
                            ? "border border-[#ead7aa] bg-[#fff8e8] text-[#7a551a] hover:bg-[#f8edcf] hover:text-[#5e3f12]"
                            : "text-[#34433b] hover:bg-[#ebe5d8] hover:text-[#17201b]"
                        }`}
                        title={
                          requestOnly
                            ? `${roadmapFeature?.label || item.label} is in request-access beta.`
                            : locked && requiredTier
                            ? `Request access to ${item.label}. Requires ${PLAN_LABEL[requiredTier]} plan.`
                            : undefined
                        }
                        aria-label={
                          requestOnly
                            ? `${item.label} (request access)`
                            : locked && requiredTier
                            ? `${item.label} (request access, requires ${PLAN_LABEL[requiredTier]} plan)`
                            : item.label
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {(requestOnly || locked) && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-[#e2c477] bg-[#fff4d6] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#7a551a]">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            Request
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </nav>
        <div className="border-t border-[#d8d1c2] p-3">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-[#d8d1c2] bg-[#fcfbf7] px-5 py-4 lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <RealtyLogo size="sm" />
            <Bell className="h-5 w-5 text-[#58665e]" aria-hidden="true" />
          </div>
          <details className="mt-4 rounded-md border border-[#d8d1c2] bg-white">
            <summary className="flex h-11 cursor-pointer list-none items-center justify-between rounded-md px-3 text-sm font-semibold text-[#17201b] [&::-webkit-details-marker]:hidden">
              Menu
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </summary>
            <nav className="max-h-[70vh] overflow-y-auto border-t border-[#d8d1c2] p-3" aria-label="Mobile dashboard modules">
              <Link
                href={primaryNavItem.href}
                className="mb-3 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-[#17201b] hover:bg-[#ebe5d8]"
              >
                <PrimaryIcon className="h-5 w-5" aria-hidden="true" />
                <span>{primaryNavItem.label}</span>
              </Link>

              <div className="space-y-2">
                {sections.map((section) => (
                  <details key={section.label} open={section.defaultOpen} className="group rounded-md">
                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md px-3 text-xs font-semibold uppercase text-[#6b4f2a] hover:bg-[#ebe5d8] [&::-webkit-details-marker]:hidden">
                      <section.icon className="h-4 w-4" aria-hidden="true" />
                      <span className="flex-1">{section.label}</span>
                      <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="mt-1 space-y-1 pl-2">
                      {section.items.map((item) => {
                        const requestOnly = Boolean(
                          item.feature && !canPreviewFutureFeatures && isRequestAccessFeature(item.feature),
                        );
                        const locked = !requestOnly && item.feature ? !hasAccess(user.planTier, item.feature) : false;
                        const requiredTier = item.feature ? tierRequiredFor(item.feature) : null;
                        const roadmapFeature = item.feature ? getRoadmapFeature(item.feature) : null;
                        const href = requestOnly
                          ? `/dashboard/request-access?feature=${item.feature}`
                          : locked && item.feature
                            ? `/dashboard/settings?request=${item.feature}`
                            : item.href;
                        return (
                          <Link
                            key={item.href}
                            href={href}
                            className={`flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                              requestOnly || locked
                                ? "border border-[#ead7aa] bg-[#fff8e8] text-[#7a551a] hover:bg-[#f8edcf] hover:text-[#5e3f12]"
                                : "text-[#34433b] hover:bg-[#ebe5d8] hover:text-[#17201b]"
                            }`}
                            title={
                              requestOnly
                                ? `${roadmapFeature?.label || item.label} is in request-access beta.`
                                : locked && requiredTier
                                  ? `Request access to ${item.label}. Requires ${PLAN_LABEL[requiredTier]} plan.`
                                  : undefined
                            }
                            aria-label={
                              requestOnly
                                ? `${item.label} (request access)`
                                : locked && requiredTier
                                  ? `${item.label} (request access, requires ${PLAN_LABEL[requiredTier]} plan)`
                                  : item.label
                            }
                          >
                            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {(requestOnly || locked) && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-[#e2c477] bg-[#fff4d6] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#7a551a]">
                                <Lock className="h-3 w-3" aria-hidden="true" />
                                Request
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </nav>
          </details>
        </div>
        {children}
      </main>
    </div>
  );
}
