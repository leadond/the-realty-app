import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download, FileText, FolderOpen, Info } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { isStorageConfigured } from "@/lib/storage/blob";
import UpgradeGate from "@/components/UpgradeGate";
import FileUploadForm from "@/components/FileUploadForm";
import DeleteDocumentButton from "@/components/DeleteDocumentButton";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export default async function FilesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <UpgradeGate userTier={user.planTier} feature="file-storage" featureLabel="File Storage">
      <FilesContent userId={user.id} />
    </UpgradeGate>
  );
}

async function FilesContent({ userId }: { userId: string }) {
  const documents = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const storageReady = isStorageConfigured();

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-[#d8d1c2] pb-5">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]">
            <ArrowLeft size={16} aria-hidden="true" />
            Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">File Storage</h1>
          <p className="mt-1 text-sm text-[#58665e]">
            Upload and store transaction documents, disclosures, and property media.
          </p>
        </header>

        <section className="mt-6 rounded-md border border-[#d8d1c2] bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b4f2a]">Upload a file</h2>
          {storageReady ? (
            <div className="mt-4">
              <FileUploadForm />
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-[#e3dccf] bg-[#fcfbf7] p-4 text-sm text-[#58665e]">
              <Info size={16} className="mt-0.5 shrink-0 text-[#6b4f2a]" aria-hidden="true" />
              <p>
                Storage is not configured yet. Add a <code className="font-mono">BLOB_READ_WRITE_TOKEN</code>{" "}
                environment variable (Vercel &rarr; Storage &rarr; Blob) to enable uploads. Existing files remain
                listed below.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-md border border-[#d8d1c2] bg-white">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <FolderOpen size={28} className="text-[#b8ad99]" aria-hidden="true" />
              <p className="text-sm font-medium">No files yet</p>
              <p className="text-sm text-[#58665e]">Uploaded documents will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#e3dccf]">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-4 px-4 py-3">
                  <FileText size={18} className="shrink-0 text-[#6b4f2a]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{doc.name}</p>
                    <p className="text-xs text-[#58665e]">
                      {formatBytes(doc.size)} &middot; {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-[#b8ad99] bg-white px-3 text-sm font-semibold"
                    >
                      <Download size={15} aria-hidden="true" />
                      Download
                    </a>
                    <DeleteDocumentButton id={doc.id} name={doc.name} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
