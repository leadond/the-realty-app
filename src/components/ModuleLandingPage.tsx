import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type ModuleAction = {
  label: string;
  href: string;
  detail: string;
};

type ModuleStat = {
  label: string;
  value: string;
};

type ModuleLandingPageProps = {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  primaryAction: ModuleAction;
  actions: ModuleAction[];
  stats: ModuleStat[];
  focus: string[];
};

export default function ModuleLandingPage({
  title,
  eyebrow,
  description,
  icon: Icon,
  primaryAction,
  actions,
  stats,
  focus,
}: ModuleLandingPageProps) {
  return (
    <div className="px-5 py-6 md:px-8">
      <header className="grid gap-5 border-b border-[#d8d1c2] pb-6 xl:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex items-center gap-3 text-[#17453b]">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-[#e2eee8]">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold uppercase text-[#6b4f2a]">{eyebrow}</p>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#58665e]">{description}</p>
          <Link
            href={primaryAction.href}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white"
          >
            {primaryAction.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 xl:grid-cols-1">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-[#d8d1c2] bg-white p-4">
              <p className="text-xs font-semibold uppercase text-[#6b4f2a]">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="grid gap-4 md:grid-cols-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-md border border-[#d8d1c2] bg-white p-5 transition hover:border-[#17453b] hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{action.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#58665e]">{action.detail}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#17453b]" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>

        <aside className="rounded-md border border-[#d8d1c2] bg-white p-5">
          <h2 className="font-semibold">Module Focus</h2>
          <ul className="mt-4 space-y-3">
            {focus.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-[#34433b]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#17453b]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}
