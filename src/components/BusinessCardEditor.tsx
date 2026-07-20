"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, ExternalLink, Loader2 } from "lucide-react";

type Profile = {
  name: string | null;
  email: string;
  phone: string | null;
  profileSlug: string | null;
  profileBio: string | null;
  profileHeadshotUrl: string | null;
};

export default function BusinessCardEditor({ initial }: { initial: Profile }) {
  const [slug, setSlug] = useState(initial.profileSlug ?? "");
  const [bio, setBio] = useState(initial.profileBio ?? "");
  const [headshotUrl, setHeadshotUrl] = useState(initial.profileHeadshotUrl ?? "");
  const [savedSlug, setSavedSlug] = useState(initial.profileSlug ?? "");

  const [origin, setOrigin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const publicUrl = savedSlug && origin ? `${origin}/u/${savedSlug}` : "";

  useEffect(() => {
    if (!publicUrl) {
      setQrDataUrl("");
      return;
    }
    let active = true;
    QRCode.toDataURL(publicUrl, { width: 240, margin: 2 })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [publicUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/business-card", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug: slug,
          profileBio: bio,
          profileHeadshotUrl: headshotUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to save your card.");
        return;
      }
      setSavedSlug(data.profile.profileSlug ?? "");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `business-card-${savedSlug}.png`;
    a.click();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-md border border-[#d8d1c2] bg-white p-6"
      >
        <div>
          <label htmlFor="slug" className="mb-1 block text-sm font-semibold">
            Public link
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-[#58665e]">{origin ? `${origin}/u/` : "/u/"}</span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="jane-doe"
              className="flex-1 rounded-md border border-[#d8d1c2] px-3 py-2 text-sm"
              aria-describedby="slug-hint"
            />
          </div>
          <p id="slug-hint" className="mt-1 text-xs text-[#58665e]">
            Lowercase letters, numbers, and hyphens. 3-40 characters.
          </p>
        </div>

        <div>
          <label htmlFor="headshot" className="mb-1 block text-sm font-semibold">
            Headshot image URL
          </label>
          <input
            id="headshot"
            type="url"
            value={headshotUrl}
            onChange={(e) => setHeadshotUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="w-full rounded-md border border-[#d8d1c2] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-semibold">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Tell clients a little about yourself…"
            className="w-full rounded-md border border-[#d8d1c2] px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-1 text-sm text-[#17453b]" role="status">
            <Check size={14} aria-hidden="true" /> Saved.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {saving ? "Saving…" : "Save card"}
        </button>
      </form>

      <div className="space-y-4 rounded-md border border-[#d8d1c2] bg-white p-6">
        <h2 className="text-sm font-semibold">Preview</h2>

        <div className="rounded-md border border-[#d8d1c2] bg-[#f7f5ef] p-5 text-center">
          {headshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headshotUrl}
              alt={initial.name ? `${initial.name} headshot` : "Agent headshot"}
              className="mx-auto h-24 w-24 rounded-full border border-[#d8d1c2] object-cover"
            />
          ) : (
            <div
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#d8d1c2] bg-white text-2xl font-semibold text-[#17453b]"
              aria-hidden="true"
            >
              {(initial.name ?? initial.email).charAt(0).toUpperCase()}
            </div>
          )}
          <p className="mt-3 text-lg font-semibold">{initial.name ?? "Your name"}</p>
          <p className="text-sm text-[#58665e]">{initial.email}</p>
          {initial.phone && <p className="text-sm text-[#58665e]">{initial.phone}</p>}
          {bio && <p className="mt-3 whitespace-pre-wrap text-sm text-[#17201b]">{bio}</p>}
        </div>

        {publicUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 truncate text-sm font-medium text-[#17453b] hover:underline"
              >
                <ExternalLink size={14} aria-hidden="true" /> {publicUrl}
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1 rounded-md border border-[#d8d1c2] px-2 py-1 text-xs font-semibold"
              >
                {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {qrDataUrl && (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR code linking to ${publicUrl}`}
                  className="mx-auto rounded-md border border-[#d8d1c2]"
                />
                <button
                  type="button"
                  onClick={downloadQr}
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#b8ad99] px-3 py-1.5 text-sm font-semibold"
                >
                  <Download size={14} aria-hidden="true" /> Download QR
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#58665e]">
            Choose a public link and save to generate your shareable URL and QR code.
          </p>
        )}
      </div>
    </div>
  );
}
