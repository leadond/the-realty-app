"use client";

import { useState } from "react";
import { BellRing, Check, Loader2, MessageSquare, Pencil } from "lucide-react";

type RequestAccessButtonProps = {
  featureKey: string;
  featureLabel: string;
  initialRequested?: boolean;
  initialNotes?: string | null;
  initialPriority?: string;
  className?: string;
};

export default function RequestAccessButton({
  featureKey,
  featureLabel,
  initialRequested = false,
  initialNotes = "",
  initialPriority = "INTERESTED",
  className = "",
}: RequestAccessButtonProps) {
  const [requested, setRequested] = useState(initialRequested);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notesOpen, setNotesOpen] = useState(Boolean(initialNotes));
  const [notes, setNotes] = useState(initialNotes || "");
  const [savedNotes, setSavedNotes] = useState(initialNotes || "");
  const [priority, setPriority] = useState(initialPriority);

  const requestAccess = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey, notes: notes.trim(), priority }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setError(data.error || "Could not record your request.");
      } else {
        setRequested(true);
        setSavedNotes(notes.trim());
      }
    } catch {
      setError("Could not record your request.");
    }
    setLoading(false);
  };

  return (
    <div className={className}>
      <label className="mb-3 block text-sm font-medium">
        Priority
        <select value={priority} onChange={(event) => setPriority(event.target.value)} className="ml-3 rounded-md border border-gray-300 bg-white px-3 py-2">
          <option value="INTERESTED">Interested</option>
          <option value="IMPORTANT">Important</option>
          <option value="URGENT">Urgent</option>
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={requestAccess}
          disabled={loading}
          className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
            requested
              ? "border border-[#a9c7b8] bg-[#eef5f0] text-[#17453b] hover:bg-[#e2eee8]"
              : "bg-[#17453b] text-white hover:bg-[#12392f]"
          } disabled:cursor-not-allowed disabled:opacity-80`}
          aria-label={requested ? `Update request for ${featureLabel}` : `Request access to ${featureLabel}`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : requested ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <BellRing className="h-4 w-4" aria-hidden="true" />
          )}
          {requested ? "Requested" : "Request Access"}
        </button>
        <button
          type="button"
          onClick={() => setNotesOpen((open) => !open)}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d8d1c2] bg-white px-3 text-sm font-semibold text-[#34433b] transition hover:border-[#b8ad99] hover:bg-[#fcfbf7]"
          aria-expanded={notesOpen}
        >
          {savedNotes ? <Pencil className="h-4 w-4" aria-hidden="true" /> : <MessageSquare className="h-4 w-4" aria-hidden="true" />}
          {savedNotes ? "Edit note" : "Add note"}
        </button>
      </div>

      {notesOpen && (
        <div className="mt-3 max-w-2xl">
          <label htmlFor={`request-notes-${featureKey}`} className="text-sm font-semibold text-[#34433b]">
            What would this unlock for your work?
          </label>
          <textarea
            id={`request-notes-${featureKey}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Example: I need this for a 12-agent team in Dallas, especially for listing alerts and broker reporting."
            className="mt-2 block w-full resize-y rounded-md border border-[#d8d1c2] bg-white px-3 py-2 text-sm text-[#17201b] outline-none transition placeholder:text-[#8a958e] focus:border-[#b98a2d] focus:ring-2 focus:ring-[#f0d49d]"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={requestAccess}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#7a551a] px-3 text-sm font-semibold text-white transition hover:bg-[#634414] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
              Save note
            </button>
            <p className="text-xs text-[#58665e]">{notes.length}/1000</p>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-2 text-sm text-[#8a3b28]">{error}</p>}
      {requested && (
        <p className="mt-2 text-sm text-[#58665e]">
          You are on the interest list for {featureLabel}
          {savedNotes ? " with context attached." : "."}
        </p>
      )}
    </div>
  );
}
