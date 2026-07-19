import Link from "next/link";
import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  Calculator,
  Database,
  FileCheck,
  FileText,
  Home,
  HousePlus,
  Mail,
  MapPin,
  Radio,
  Search,
  Star,
  Store,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Lead Tracker", href: "/dashboard/leads" },
  { icon: Calendar, label: "Showings", href: "/dashboard/showings" },
  { icon: Database, label: "CRM", href: "/dashboard/crm" },
  { icon: Search, label: "Market Research", href: "/dashboard/market-research" },
  { icon: TrendingUp, label: "Property Valuation", href: "/dashboard/valuation" },
  { icon: FileText, label: "Listing Generator", href: "/dashboard/listings" },
  { icon: Mail, label: "Email Templates", href: "/dashboard/email-templates" },
  { icon: MapPin, label: "Showing Assistant", href: "/dashboard/showing-assistant" },
  { icon: Store, label: "Property Matchmaker", href: "/dashboard/matchmaker" },
  { icon: Radio, label: "Marketing", href: "/dashboard/marketing" },
  { icon: Star, label: "Reviews", href: "/dashboard/reviews" },
  { icon: Calculator, label: "Mortgage Calc", href: "/dashboard/mortgage" },
  { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
  { icon: HousePlus, label: "Open Houses", href: "/dashboard/open-houses" },
  { icon: Briefcase, label: "Transactions", href: "/dashboard/transactions" },
  { icon: UserCheck, label: "Client Portal", href: "/dashboard/clients" },
  { icon: FileCheck, label: "Documents", href: "/dashboard/documents" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f7f5ef] text-[#17201b]">
      <aside className="hidden w-72 shrink-0 border-r border-[#d8d1c2] bg-[#fcfbf7] lg:block">
        <div className="border-b border-[#d8d1c2] p-5">
          <h1 className="text-xl font-semibold">Realtor AI</h1>
          <p className="mt-1 text-sm text-[#58665e]">Local demo workspace</p>
        </div>
        <nav className="p-3" aria-label="Dashboard modules">
          {navItems.map((item) => (
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
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-[#d8d1c2] bg-[#fcfbf7] px-5 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <h1 className="font-semibold">Realtor AI</h1>
            <Bell className="h-5 w-5 text-[#58665e]" aria-hidden="true" />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
