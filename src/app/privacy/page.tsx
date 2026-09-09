import Link from "next/link";

export const metadata = {
  title: "Privacy & Cookie Notice | The Realty App",
  description: "Privacy and cookie details for The Realty App.",
};

const cookieRows = [
  {
    category: "Essential",
    purpose: "Authentication, session security, account access, fraud prevention, and saved consent preferences.",
    consent: "Always active",
  },
  {
    category: "Preferences",
    purpose: "Remembering product settings such as cookie choice and interface preferences.",
    consent: "Essential only unless expanded later",
  },
  {
    category: "Analytics",
    purpose: "Product usage measurement, only if analytics is added and the user accepts optional cookies.",
    consent: "Optional",
  },
  {
    category: "Marketing",
    purpose: "Advertising or retargeting cookies. The current app does not load these cookies.",
    consent: "Optional",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-10 text-[#17201b] md:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-[#17453b] underline">
          Back to The Realty App
        </Link>

        <header className="mt-8 border-b border-[#d8d1c2] pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a5d24]">Privacy & Cookie Notice</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal">How The Realty App uses cookies</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#465158]">
            This notice explains the browser storage used by The Realty App. It is written for product transparency and should be reviewed by your attorney before public launch.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-[#d8d1c2] bg-white p-5">
            <h2 className="text-lg font-semibold">What is active now</h2>
            <p className="mt-2 text-sm leading-6 text-[#465158]">
              The current app uses essential cookies and local browser storage for login, security, app function, and remembering cookie consent. No advertising pixels or analytics trackers were found in the current codebase.
            </p>
          </div>
          <div className="rounded-md border border-[#d8d1c2] bg-white p-5">
            <h2 className="text-lg font-semibold">Your controls</h2>
            <p className="mt-2 text-sm leading-6 text-[#465158]">
              Use the Cookie settings button in the lower-left corner of the app to accept optional cookies or keep the app limited to essential storage.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-md border border-[#d8d1c2] bg-white">
          <div className="border-b border-[#d8d1c2] p-5">
            <h2 className="text-xl font-semibold">Cookie categories</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-[#fcfbf7] text-xs uppercase tracking-[0.12em] text-[#6b4f2a]">
                <tr>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Purpose</th>
                  <th className="px-5 py-3">Consent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe5d8]">
                {cookieRows.map((row) => (
                  <tr key={row.category}>
                    <td className="px-5 py-4 font-semibold">{row.category}</td>
                    <td className="px-5 py-4 text-[#465158]">{row.purpose}</td>
                    <td className="px-5 py-4 text-[#465158]">{row.consent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-md border border-[#d8d1c2] bg-white p-5">
          <h2 className="text-xl font-semibold">Recommended launch follow-up</h2>
          <p className="mt-2 text-sm leading-6 text-[#465158]">
            Before marketing the app publicly, publish a full Privacy Policy, Terms of Service, contact email, and state-specific privacy rights language for the markets you serve. If analytics, ads, chat widgets, or embedded third-party tools are added later, keep them behind the optional consent choice.
          </p>
        </section>
      </div>
    </main>
  );
}
