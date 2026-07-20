import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Webhook } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import UpgradeGate from "@/components/UpgradeGate";
import WebhookForm from "@/components/WebhookForm";

export const dynamic = "force-dynamic";

const EVENT_REFERENCE: { name: string; description: string }[] = [
  { name: "lead.created", description: "Fires when a new lead is added to your pipeline." },
  { name: "showing.scheduled", description: "Fires when a property showing is scheduled." },
  { name: "contract.signed", description: "Fires when a contract becomes fully signed." },
];

export default async function WebhooksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, events: true, isActive: true, createdAt: true },
  });

  const initialEndpoints = endpoints.map((endpoint) => ({
    ...endpoint,
    createdAt: endpoint.createdAt.toISOString(),
  }));

  return (
    <UpgradeGate userTier={user.planTier} feature="webhooks" featureLabel="Webhook Export">
      <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
        <div className="mx-auto max-w-4xl">
          <header className="border-b border-[#d8d1c2] pb-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Dashboard
            </Link>
            <h1 className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-normal">
              <Webhook size={28} className="text-[#17453b]" aria-hidden="true" />
              Webhook export
            </h1>
            <p className="mt-1 text-sm text-[#58665e]">
              Push real-time events from The Realty App to your own systems.
            </p>
          </header>

          <div className="mt-6">
            <WebhookForm initialEndpoints={initialEndpoints} />
          </div>

          <section className="mt-6 rounded-md border border-[#d8d1c2] bg-white p-6">
            <h2 className="text-lg font-semibold">Available events</h2>
            <ul className="mt-3 space-y-2">
              {EVENT_REFERENCE.map((event) => (
                <li key={event.name} className="text-sm">
                  <code className="rounded bg-[#f1eadc] px-1.5 py-0.5 text-xs font-semibold text-[#6b4f2a]">
                    {event.name}
                  </code>
                  <span className="ml-2 text-[#58665e]">{event.description}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-6 text-lg font-semibold">Verifying signatures</h2>
            <p className="mt-2 text-sm text-[#58665e]">
              Every delivery includes an <code className="rounded bg-[#f1eadc] px-1 py-0.5 text-xs">X-Webhook-Signature</code>{" "}
              header. To verify authenticity, compute an HMAC-SHA256 digest over the raw
              request body (the exact JSON bytes we send, before any parsing) using your
              endpoint&apos;s signing secret as the key, hex-encode it, and compare it to the
              header value using a constant-time comparison. Reject the request if they do not
              match. The signed payload has the shape{" "}
              <code className="rounded bg-[#f1eadc] px-1 py-0.5 text-xs">
                {"{ event, timestamp, data }"}
              </code>
              . Store the secret securely — it is shown only once at creation time and can only
              be replaced by deleting and recreating the endpoint.
            </p>
          </section>
        </div>
      </main>
    </UpgradeGate>
  );
}
