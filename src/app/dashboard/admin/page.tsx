import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ExternalLink, KeyRound, ShieldCheck, XCircle } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { getPlatformConfig, type ConfigStatus } from "@/lib/platform-config";
import PlatformSecretForm from "@/components/PlatformSecretForm";

export const dynamic = "force-dynamic";

export default async function AdminOperationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const config = await getPlatformConfig();
  const required = config.filter((item) => item.required);
  const optional = config.filter((item) => !item.required);
  const requiredReady = required.every((item) => item.configured);
  const configuredCount = config.filter((item) => item.configured).length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#6b4f2a]">Platform operations</p>
          <h1 className="mt-1 text-3xl font-bold text-[#17201b]">Backend Admin</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#58665e]">
            Check production connections, identify missing environment variables, and keep operational setup in one place.
            Secret values are never displayed here.
          </p>
        </div>
        <Link href="/dashboard/requests" className="inline-flex items-center justify-center rounded-md border border-[#d8d1c2] bg-white px-4 py-2 text-sm font-semibold text-[#34433b] hover:bg-[#f4f0e7]">
          Review feature requests
        </Link>
      </div>

      <section className={`rounded-lg border p-5 ${requiredReady ? "border-[#b8d5c1] bg-[#eef7f0]" : "border-[#ead7aa] bg-[#fff8e8]"}`}>
        <div className="flex items-start gap-3">
          {requiredReady ? <CheckCircle2 className="mt-0.5 text-[#28754b]" /> : <XCircle className="mt-0.5 text-[#9a6815]" />}
          <div>
            <h2 className="font-semibold text-[#17201b]">{requiredReady ? "Core backend is configured" : "Core backend setup is incomplete"}</h2>
            <p className="mt-1 text-sm text-[#58665e]">{configuredCount} of {config.length} tracked connections are configured. Optional services can be enabled as you prepare them.</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#17453b]" /><h2 className="text-lg font-semibold">Required for the app to run</h2></div>
        <div className="grid gap-3 md:grid-cols-2">
          {required.map((item) => <ConfigCard key={item.key} item={item} />)}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><KeyRound className="h-5 w-5 text-[#6b4f2a]" /><h2 className="text-lg font-semibold">Optional connections</h2></div>
        <div className="grid gap-3 md:grid-cols-2">
          {optional.map((item) => <ConfigCard key={item.key} item={item} />)}
        </div>
      </section>

      <section className="rounded-lg border border-[#d8d1c2] bg-white p-5">
        <h2 className="font-semibold">Where to configure these</h2>
        <p className="mt-2 text-sm text-[#58665e]">
          Items marked <strong>editable below</strong> can be set right here — the value is encrypted and stored in the
          database, since Vercel environment variables can&apos;t be changed without a redeploy. Everything else
          (database connection, auth secret, the app&apos;s canonical URL, and push-notification keys inlined at build
          time) must still be set as a real environment variable: for local development in <code>.env.local</code>, for
          production in Vercel under Project Settings → Environment Variables, then redeploy. Never paste those into
          this page.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/settings" className="rounded-md bg-[#17453b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f382f]">Open account settings</Link>
          <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-[#d8d1c2] px-4 py-2 text-sm font-semibold text-[#34433b] hover:bg-[#f4f0e7]">Open Vercel <ExternalLink className="h-4 w-4" /></a>
        </div>
      </section>
    </div>
  );
}

function ConfigCard({ item }: { item: ConfigStatus }) {
  return (
    <div className="rounded-lg border border-[#d8d1c2] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#17201b]">{item.label}</h3>
          <code className="text-xs text-[#6b4f2a]">{item.key}</code>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${item.configured ? "bg-[#e6f3e9] text-[#28754b]" : "bg-[#f7e9e4] text-[#8a3b28]"}`}>
          {item.configured ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {item.configured ? "Configured" : "Missing"}
        </span>
      </div>
      <p className="mt-2 text-sm text-[#58665e]">{item.purpose}</p>
      {item.setupUrl && <a href={item.setupUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#17453b] underline">Provider setup <ExternalLink className="h-3 w-3" /></a>}
      {item.managed ? (
        <PlatformSecretForm configKey={item.key} />
      ) : (
        <p className="mt-3 text-xs italic text-[#9a9284]">Environment variable only — see note below.</p>
      )}
    </div>
  );
}
