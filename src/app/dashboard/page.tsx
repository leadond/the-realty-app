import { redirect } from "next/navigation";
import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const cards = [
  { label: "Total Leads", key: "leads", icon: Users },
  { label: "Showings This Week", key: "showings", icon: Calendar },
  { label: "Active Listings", key: "properties", icon: TrendingUp },
  { label: "Pipeline Value", key: "value", icon: DollarSign },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [leads, showings, properties] = await Promise.all([
    prisma.lead.count({ where: { userId: user.id } }),
    prisma.showing.count({ where: { userId: user.id } }),
    prisma.property.count({ where: { userId: user.id } }),
  ]);

  const pipelineValue = await prisma.lead.aggregate({
    where: { userId: user.id },
    _sum: { budgetMax: true },
  });

  const values: Record<string, string> = {
    leads: String(leads),
    showings: String(showings),
    properties: String(properties),
    value: `$${Math.round((pipelineValue._sum.budgetMax ?? 0) / 1000)}k`,
  };

  return (
    <div className="px-5 py-6 md:px-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-[#6b4f2a]">
          {user.organization ? user.organization.name : "Your workspace"}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">
          Welcome back, {user.name?.split(" ")[0] || "there"}
        </h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="rounded-md border border-[#d8d1c2] bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#58665e]">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{values[card.key]}</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-md bg-[#e2eee8] text-[#17453b]">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
