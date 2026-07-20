import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import UpgradeGate from "@/components/UpgradeGate";
import VoiceNoteRecorder from "@/components/VoiceNoteRecorder";

export const dynamic = "force-dynamic";

export default async function VoiceNotesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UpgradeGate userTier={user.planTier} feature="voice-notes" featureLabel="Voice Notes">
      <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
        <div className="mx-auto max-w-3xl">
          <header className="border-b border-[#d8d1c2] pb-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">Voice notes</h1>
            <p className="mt-1 text-sm text-[#58665e]">
              Dictate a quick note and save it straight to your task list.
            </p>
          </header>

          <div className="mt-6">
            <VoiceNoteRecorder />
          </div>
        </div>
      </main>
    </UpgradeGate>
  );
}
