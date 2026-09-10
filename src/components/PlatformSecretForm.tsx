"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";

export default function PlatformSecretForm({ configKey }: { configKey: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    const res = await fetch("/api/admin/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: configKey, value }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setValue("");
      setSuccess(true);
      router.refresh();
    } else {
      setError(data.error || "Failed to save");
    }
  };

  const handleClear = async () => {
    if (!confirm(`Remove the stored override for ${configKey}? This falls back to the environment variable, if any.`)) return;
    setClearing(true);
    setError("");
    const res = await fetch("/api/admin/secrets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: configKey }),
    });
    const data = await res.json();
    setClearing(false);
    if (data.ok) {
      router.refresh();
    } else {
      setError(data.error || "Failed to clear");
    }
  };

  return (
    <form onSubmit={handleSave} className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter value..."
        autoComplete="off"
        className="min-w-0 flex-1 rounded-md border border-[#d8d1c2] px-2 py-1.5 text-xs"
      />
      <button
        type="submit"
        disabled={saving || !value.trim()}
        className="inline-flex items-center gap-1 rounded-md bg-[#17453b] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        Save
      </button>
      <button
        type="button"
        onClick={handleClear}
        disabled={clearing}
        className="inline-flex items-center gap-1 rounded-md border border-[#d8d1c2] px-2.5 py-1.5 text-xs font-semibold text-[#58665e] disabled:opacity-50"
      >
        {clearing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        Clear
      </button>
      {success && <span className="text-xs font-semibold text-[#28754b]">Saved</span>}
      {error && <span className="text-xs font-semibold text-[#8a3b28]">{error}</span>}
    </form>
  );
}
