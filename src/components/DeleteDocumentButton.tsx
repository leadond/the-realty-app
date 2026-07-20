"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteDocumentButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        return;
      }
    } catch {
      // fall through to re-enable the button
    }
    setDeleting(false);
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-label={`Delete ${name}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d8d1c2] bg-white text-[#8a3b2f] disabled:opacity-50"
    >
      {deleting ? (
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 size={15} aria-hidden="true" />
      )}
    </button>
  );
}
