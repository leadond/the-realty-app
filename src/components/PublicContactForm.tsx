"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PublicContactForm({ slug }: { slug: string }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/public/business-card/${encodeURIComponent(slug)}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not send your message. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Could not send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-md border border-[#d8d1c2] bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto mb-2 text-[#17453b]" size={36} aria-hidden="true" />
        <h2 className="text-lg font-semibold">Thanks for reaching out!</h2>
        <p className="mt-1 text-sm text-[#58665e]">Your message has been sent. You&apos;ll hear back soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-[#d8d1c2] bg-white p-6">
      <h2 className="text-lg font-semibold">Get in touch</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
            First name
          </label>
          <input
            id="firstName"
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            maxLength={200}
            className="w-full rounded-md border border-[#d8d1c2] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
            Last name
          </label>
          <input
            id="lastName"
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            maxLength={200}
            className="w-full rounded-md border border-[#d8d1c2] px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          maxLength={200}
          className="w-full rounded-md border border-[#d8d1c2] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          maxLength={200}
          className="w-full rounded-md border border-[#d8d1c2] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={4}
          maxLength={2000}
          className="w-full rounded-md border border-[#d8d1c2] px-3 py-2 text-sm"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
