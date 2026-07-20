"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

export default function FileUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Upload failed.");
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label htmlFor="file-upload" className="sr-only">
        Choose a file to upload
      </label>
      <input
        id="file-upload"
        ref={inputRef}
        type="file"
        disabled={uploading}
        className="block w-full text-sm text-[#17201b] file:mr-3 file:h-10 file:cursor-pointer file:rounded-md file:border file:border-[#b8ad99] file:bg-white file:px-3 file:text-sm file:font-semibold"
      />
      <button
        type="submit"
        disabled={uploading}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Upload size={16} aria-hidden="true" />
        )}
        Upload
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
