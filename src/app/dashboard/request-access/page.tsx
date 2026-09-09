import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BellRing, Clock3, Compass, LockKeyhole, MessageSquare } from "lucide-react";

import RequestAccessButton from "@/components/RequestAccessButton";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getRoadmapFeature, REQUEST_ACCESS_FEATURES } from "@/lib/feature-roadmap";

export const dynamic = "force-dynamic";

type RequestAccessPageProps = {
  searchParams: Promise<{ feature?: string }>;
};

export default async function RequestAccessPage({ searchParams }: RequestAccessPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const selectedFeature = getRoadmapFeature(params.feature) || REQUEST_ACCESS_FEATURES[0];
  const existingRequest = await prisma.featureAccessRequest.findUnique({
    where: { userId_featureKey: { userId: user.id, featureKey: selectedFeature.key } },
    select: { id: true, notes: true, priority: true, status: true, requestedAt: true, updatedAt: true },
  });

  return (
    <div className="px-5 py-6 md:px-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[#58665e] hover:text-[#17201b]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-md border border-[#d8d1c2] bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-sm bg-[#f5ead5] px-2.5 py-1 text-xs font-semibold uppercase text-[#7a4f16]">
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
              Request Access
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#ead7aa] bg-[#fff8e8] px-2.5 py-1 text-xs font-semibold text-[#7a551a]">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              Limited rollout
            </span>
          </div>

          <div className="mt-5 max-w-3xl">
            <p className="text-sm font-semibold uppercase text-[#6b4f2a]">{selectedFeature.group}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal md:text-4xl">
              {selectedFeature.label} is not generally available yet
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#58665e] md:text-base">{selectedFeature.description}</p>
          </div>

          <div className="mt-5 rounded-md border border-[#e6d6b8] bg-[#fff8eb] p-4 text-sm leading-6 text-[#6b4f2a]">
            {selectedFeature.reason}
          </div>

          <RequestAccessButton
            key={selectedFeature.key}
            featureKey={selectedFeature.key}
            featureLabel={selectedFeature.label}
            initialRequested={Boolean(existingRequest)}
            initialNotes={existingRequest?.notes}
            initialPriority={existingRequest?.priority}
            className="mt-6"
          />
        </section>

        <aside className="rounded-md border border-[#d8d1c2] bg-[#fcfbf7] p-5">
          <h2 className="text-sm font-semibold uppercase text-[#6b4f2a]">Triage signals</h2>
          <div className="mt-4 space-y-4">
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#e2eee8] text-[#17453b]">
                <Compass className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">Market need</p>
                <p className="mt-1 text-sm text-[#58665e]">Where this would matter and how often your team would use it.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#f5ead5] text-[#7a551a]">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">Workflow context</p>
                <p className="mt-1 text-sm text-[#58665e]">What you are doing outside the app today to fill the gap.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#efe9de] text-[#6b4f2a]">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">Timing</p>
                <p className="mt-1 text-sm text-[#58665e]">Whether this blocks a current deal, launch, or brokerage rollout.</p>
              </div>
            </div>
          </div>

          {existingRequest && (
            <div className="mt-5 border-t border-[#e3dccf] pt-4 text-sm text-[#58665e]">
              <p>
                Status: <span className="font-semibold text-[#17453b]">{existingRequest.status}</span>
              </p>
              <p className="mt-1">Requested {existingRequest.requestedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
            </div>
          )}
        </aside>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#6b4f2a]">Roadmap queue</p>
            <h2 className="mt-1 text-lg font-semibold">Other upcoming features</h2>
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {REQUEST_ACCESS_FEATURES.filter((feature) => feature.key !== selectedFeature.key).map((feature) => (
            <Link
              key={feature.key}
              href={`/dashboard/request-access?feature=${feature.key}`}
              className="rounded-md border border-[#d8d1c2] bg-white p-4 hover:border-[#b8ad99]"
            >
              <p className="text-xs font-semibold uppercase text-[#6b4f2a]">{feature.group}</p>
              <h3 className="mt-1 font-semibold">{feature.label}</h3>
              <p className="mt-2 text-sm text-[#58665e]">{feature.description}</p>
              <p className="mt-3 text-xs font-semibold text-[#7a551a]">Request signal</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
