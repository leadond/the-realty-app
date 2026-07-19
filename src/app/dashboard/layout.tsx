import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Calculator,
  Database,
  FileCheck,
  FileSignature,
  FileText,
  Home,
  HousePlus,
  Mail,
  MapPin,
  Plug,
  Radio,
  Search,
  Send,
  Settings,
  Share2,
  Star,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import SignOutButton from "@/components/SignOutButton";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Lead Tracker", href: "/dashboard/leads" },
  { icon: Building2, label: "Properties", href: "/dashboard/properties" },
  { icon: Database, label: "CRM", href: "/dashboard/crm" },
  { icon: Calendar, label: "Showings", href: "/dashboard/showings" },
  { icon: HousePlus, label: "Open Houses", href: "/dashboard/open-houses" },
  { icon: Briefcase, label: "Transactions", href: "/dashboard/transactions" },
  { icon: FileSignature, label: "Contracts", href: "/dashboard/contracts" },
  { icon: UserCheck, label: "Client Portal", href: "/dashboard/clients" },
  { icon: FileCheck, label: "Documents", href: "/dashboard/documents" },
  { icon: Search, label: "Market Research", href: "/dashboard/market-research" },
  { icon: TrendingUp, label: "Property Valuation", href: "/dashboard/valuation" },
  { icon: FileText, label: "Listing Generator", href: "/dashboard/listings" },
  { icon: Store, label: "Property Matchmaker", href: "/dashboard/matchmaker" },
  { icon: MapPin, label: "Showing Assistant", href: "/dashboard/showing-assistant" },
  { icon: Radio, label: "Marketing", href: "/dashboard/marketing" },
  { icon: Share2, label: "Social Scheduler", href: "/dashboard/social" },
  { icon: Mail, label: "Email Templates", href: "/dashboard/email-templates" },
  { icon: Send, label: "Email Campaigns", href: "/dashboard/email-campaigns" },
  { icon: Star, label: "Reviews", href: "/dashboard/reviews" },
  { icon: Workflow, label: "Automations", href: "/dashboard/automations" },
  { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
  { icon: Calculator, label: "Mortgage Calc", href: "/dashboard/mortgage" },
  { icon: Plug, label: "Connected Apps", href: "/dashboard/integrations" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = user.role === "BROKER"
    ? [...navItems, { icon: Briefcase, label: "Broker Dashboard", href: "/dashboard/broker" }]
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
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mb-1 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#34433b] hover:bg-[#ebe5d8]"
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}
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
