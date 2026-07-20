import { redirect } from "next/navigation";
import { IdCard } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import UpgradeGate from "@/components/UpgradeGate";
import BusinessCardEditor from "@/components/BusinessCardEditor";

export default async function BusinessCardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UpgradeGate userTier={user.planTier} feature="business-card" featureLabel="Digital Business Card">
      <main className="min-h-screen bg-[#f7f5ef] p-6 text-[#17201b]">
        <header className="mb-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <IdCard className="text-[#17453b]" aria-hidden="true" /> Digital Business Card
          </h1>
          <p className="mt-1 text-sm text-[#58665e]">
            Share a public profile page and QR code that turns scans into leads.
          </p>
        </header>

        <BusinessCardEditor
          initial={{
            name: user.name,
            email: user.email,
            phone: user.phone,
            profileSlug: user.profileSlug,
            profileBio: user.profileBio,
            profileHeadshotUrl: user.profileHeadshotUrl,
          }}
        />
      </main>
    </UpgradeGate>
  );
}
