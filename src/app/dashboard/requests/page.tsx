import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { BarChart3, Building2, CalendarClock, Check, ClipboardList, Save, Users } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "REVIEWED", "PLANNED", "SHIPPED"] as const;

type FeatureRequestStatus = (typeof STATUSES)[number];

type FeatureRequestTotal = {
  featureKey: string;
  featureLabel: string;
  group: string;
  requestCount: number;
  urgentCount: number;
  importantCount: number;
  latestRequestAt: string | null;
};

type FeatureRequestRow = {
  id: string;
  featureKey: string;
  featureLabel: string;
  requesterRole: string | null;
  status: FeatureRequestStatus;
  priority: string;
  notes: string | null;
  requestedAt: string;
  updatedAt: string;
  user: {
    name: string | null;
    email: string;
    role: string;
  };
  organization: {
    name: string;
  } | null;
};

type FeatureRequestsPayload = {
  ok: true;
  totals: FeatureRequestTotal[];
  requests: FeatureRequestRow[];
};

function getOrigin(headerList: Awaited<ReturnType<typeof headers>>): string | null {
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  if (!host) return null;

  const protocol =
    headerList.get("x-forwarded-proto") ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

async function fetchFeatureRequests(): Promise<FeatureRequestsPayload> {
  const headerList = await headers();
  const origin = getOrigin(headerList);
  if (!origin) return { ok: true, totals: [], requests: [] };

  const response = await fetch(`${origin}/api/feature-requests`, {
    cache: "no-store",
    headers: { cookie: headerList.get("cookie") || "" },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Could not load feature requests.");
  }

  return data as FeatureRequestsPayload;
}

async function updateFeatureRequest(formData: FormData) {
  "use server";

  const requestId = String(formData.get("requestId") || "");
  const status = String(formData.get("status") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!requestId || !STATUSES.includes(status as FeatureRequestStatus)) return;

  const headerList = await headers();
  const origin = getOrigin(headerList);
  if (!origin) return;

  const response = await fetch(`${origin}/api/feature-requests`, {
    method: "PATCH",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      cookie: headerList.get("cookie") || "",
    },
    body: JSON.stringify({ requestId, status, notes }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Could not update feature request.");
  }

  revalidatePath("/dashboard/requests");
}

function formatDate(value: string | null): string {
  if (!value) return "No requests";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function statusClassName(status: FeatureRequestStatus): string {
  switch (status) {
    case "SHIPPED":
      return "border-[#a9c7b8] bg-[#eef5f0] text-[#17453b]";
    case "PLANNED":
      return "border-[#c9d6aa] bg-[#f1f6df] text-[#53651f]";
    case "REVIEWED":
      return "border-[#c9bdad] bg-[#f5efe6] text-[#654b2b]";
    default:
      return "border-[#ead7aa] bg-[#fff8e8] text-[#7a551a]";
  }
}

export default async function FeatureRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "BROKER") redirect("/dashboard");

  const { totals, requests } = await fetchFeatureRequests();
  const organizations = new Set(requests.map((request) => request.organization?.name || "Solo"));
  const notesCount = requests.filter((request) => request.notes).length;
  const plannedOrShippedCount = requests.filter(
    (request) => request.status === "PLANNED" || request.status === "SHIPPED",
  ).length;

  return (
    <div className="px-5 py-6 md:px-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-[#6b4f2a]">{user.role === "ADMIN" ? "Founder dashboard" : "Broker dashboard"}</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-normal">
          <BarChart3 className="h-7 w-7 text-[#17453b]" aria-hidden="true" />
          Feature Requests
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#58665e]">
          Demand signals from agents and brokers requesting future features.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Feature request summary">
        <div className="rounded-md border border-[#d8d1c2] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#58665e]">Total requests</p>
            <Users className="h-5 w-5 text-[#17453b]" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-semibold">{requests.length}</p>
        </div>
        <div className="rounded-md border border-[#d8d1c2] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#58665e]">Organizations</p>
            <Building2 className="h-5 w-5 text-[#17453b]" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-semibold">{organizations.size}</p>
        </div>
        <div className="rounded-md border border-[#d8d1c2] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#58665e]">With notes</p>
            <ClipboardList className="h-5 w-5 text-[#17453b]" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-semibold">{notesCount}</p>
        </div>
        <div className="rounded-md border border-[#d8d1c2] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#58665e]">Planned or shipped</p>
            <Check className="h-5 w-5 text-[#17453b]" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-semibold">{plannedOrShippedCount}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Requests by feature">
        {totals.map((feature) => (
          <div key={feature.featureKey} className="rounded-md border border-[#d8d1c2] bg-white p-4">
            <p className="text-xs font-semibold uppercase text-[#6b4f2a]">{feature.group}</p>
            <h2 className="mt-1 font-semibold">{feature.featureLabel}</h2>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold">{feature.requestCount}</p>
              <p className="text-right text-xs text-[#58665e]">{formatDate(feature.latestRequestAt)}</p>
            </div>
            <p className="mt-2 text-xs text-gray-600">{feature.urgentCount} urgent · {feature.importantCount} important</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-md border border-[#d8d1c2] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3dccf] px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarClock className="h-5 w-5 text-[#17453b]" aria-hidden="true" />
            Recent Requests
          </h2>
          <p className="text-sm text-[#58665e]">{requests.length ? "Newest activity first" : "No queue yet"}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="bg-[#f7f5ef] text-left text-[#58665e]">
              <tr>
                <th className="w-52 px-4 py-3 font-medium">Feature</th>
                <th className="w-56 px-4 py-3 font-medium">Requester</th>
                <th className="w-44 px-4 py-3 font-medium">Organization</th>
                <th className="w-72 px-4 py-3 font-medium">Notes</th>
                <th className="w-44 px-4 py-3 font-medium">Status</th>
                <th className="w-44 px-4 py-3 font-medium">Dates</th>
                <th className="w-24 px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccf]">
              {requests.map((request) => (
                <tr key={request.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-semibold">{request.featureLabel}</p>
                    <p className="mt-1 text-xs text-[#58665e]">{request.priority}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{request.user.name || request.user.email}</p>
                    <p className="mt-1 break-all text-xs text-[#58665e]">{request.user.email}</p>
                    <p className="mt-1 text-xs font-semibold uppercase text-[#6b4f2a]">
                      {request.requesterRole || request.user.role}
                    </p>
                  </td>
                  <td className="px-4 py-4">{request.organization?.name || "Solo"}</td>
                  <td className="px-4 py-4">
                    <form id={`request-${request.id}`} action={updateFeatureRequest}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <textarea
                        name="notes"
                        defaultValue={request.notes || ""}
                        rows={3}
                        maxLength={1000}
                        aria-label={`Notes for ${request.featureLabel} request from ${request.user.email}`}
                        placeholder="No context yet."
                        className="block w-full resize-y rounded-md border border-[#d8d1c2] bg-white px-3 py-2 text-sm text-[#17201b] outline-none transition placeholder:text-[#8a958e] focus:border-[#b98a2d] focus:ring-2 focus:ring-[#f0d49d]"
                      />
                    </form>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`mb-2 inline-flex rounded-sm border px-2 py-1 text-xs font-semibold ${statusClassName(request.status)}`}>
                      {request.status}
                    </span>
                    <select
                      name="status"
                      form={`request-${request.id}`}
                      defaultValue={request.status}
                      aria-label={`Status for ${request.featureLabel} request from ${request.user.email}`}
                      className="block h-9 w-full rounded-md border border-[#d8d1c2] bg-white px-2 text-sm font-medium text-[#17201b] outline-none focus:border-[#b98a2d] focus:ring-2 focus:ring-[#f0d49d]"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-[#58665e]">
                    <p>
                      <span className="font-medium text-[#34433b]">Requested</span>
                      <br />
                      {formatDate(request.requestedAt)}
                    </p>
                    <p className="mt-2">
                      <span className="font-medium text-[#34433b]">Updated</span>
                      <br />
                      {formatDate(request.updatedAt)}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="submit"
                      form={`request-${request.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-[#17453b] px-3 text-sm font-semibold text-white transition hover:bg-[#12392f]"
                    >
                      <Save className="h-4 w-4" aria-hidden="true" />
                      Save
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#58665e]">
                    No request-access signals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
