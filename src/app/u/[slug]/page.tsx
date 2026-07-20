import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";

import { prisma } from "@/lib/db";
import PublicContactForm from "@/components/PublicContactForm";

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const agent = await prisma.user.findUnique({
    where: { profileSlug: slug },
    select: {
      name: true,
      email: true,
      phone: true,
      profileSlug: true,
      profileBio: true,
      profileHeadshotUrl: true,
    },
  });

  if (!agent || !agent.profileSlug) notFound();

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#17201b]">
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        <section className="rounded-md border border-[#d8d1c2] bg-white p-6 text-center">
          {agent.profileHeadshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agent.profileHeadshotUrl}
              alt={agent.name ? `${agent.name} headshot` : "Agent headshot"}
              className="mx-auto h-28 w-28 rounded-full border border-[#d8d1c2] object-cover"
            />
          ) : (
            <div
              className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-[#d8d1c2] bg-[#f7f5ef] text-3xl font-semibold text-[#17453b]"
              aria-hidden="true"
            >
              {(agent.name ?? agent.email).charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="mt-4 text-2xl font-bold">{agent.name ?? "Real Estate Agent"}</h1>
          {agent.profileBio && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#17201b]">{agent.profileBio}</p>
          )}
          <div className="mt-4 space-y-2 border-t border-[#d8d1c2] pt-4 text-sm">
            <a
              href={`mailto:${agent.email}`}
              className="inline-flex items-center gap-2 text-[#17453b] hover:underline"
            >
              <Mail size={14} aria-hidden="true" /> {agent.email}
            </a>
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="flex items-center justify-center gap-2 text-[#17453b] hover:underline"
              >
                <Phone size={14} aria-hidden="true" /> {agent.phone}
              </a>
            )}
          </div>
        </section>

        <PublicContactForm slug={agent.profileSlug} />
      </div>
    </main>
  );
}
