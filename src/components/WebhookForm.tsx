"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Plus, Power, Trash2, TriangleAlert } from "lucide-react";

type WebhookEndpoint = {
  id: string;
  url: string;
  events: string;
  isActive: boolean;
  createdAt: string;
};

type WebhookFormProps = {
  initialEndpoints: WebhookEndpoint[];
};

const AVAILABLE_EVENTS = ["lead.created", "showing.scheduled", "contract.signed"];

export default function WebhookForm({ initialEndpoints }: WebhookFormProps) {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(initialEndpoints);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    setNewSecret(null);
    try {
      const res = await fetch("/api/webhooks-config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, events: selectedEvents }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to create endpoint");
        return;
      }
      setEndpoints((prev) => [data.endpoint, ...prev]);
      setNewSecret(data.secret);
      setUrl("");
      setSelectedEvents([]);
    } catch {
      setError("Network error while creating endpoint");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (endpoint: WebhookEndpoint) => {
    setBusyId(endpoint.id);
    try {
      const res = await fetch(`/api/webhooks-config/${endpoint.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !endpoint.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setEndpoints((prev) => prev.map((e) => (e.id === endpoint.id ? data.endpoint : e)));
      }
    } catch {
      // Leave state unchanged on failure.
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/webhooks-config/${id}`, { method: "DELETE" });
      if (res.status === 204) {
        setEndpoints((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      // Leave state unchanged on failure.
    } finally {
      setBusyId(null);
    }
  };

  const copySecret = () => {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-[#d8d1c2] bg-white p-6">
        <h2 className="text-lg font-semibold">Add an endpoint</h2>
        <p className="mt-1 text-sm text-[#58665e]">
          We will POST a signed JSON payload to this URL when the selected events occur.
        </p>

        <div className="mt-4">
          <label htmlFor="webhook-url" className="block text-sm font-medium">
            Endpoint URL
          </label>
          <input
            id="webhook-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhooks/realty"
            className="mt-1 w-full rounded-md border border-[#d8d1c2] px-3 py-2 text-sm"
          />
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Events</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {AVAILABLE_EVENTS.map((event) => {
              const active = selectedEvents.includes(event);
              return (
                <button
                  key={event}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleEvent(event)}
                  className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium ${
                    active
                      ? "border-[#17453b] bg-[#17453b] text-white"
                      : "border-[#d8d1c2] bg-white text-[#17201b]"
                  }`}
                >
                  {event}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !url || selectedEvents.length === 0}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {creating ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          Create endpoint
        </button>

        {newSecret && (
          <div className="mt-5 rounded-md border border-[#c9a227] bg-[#fdf7e3] p-4" role="alert">
            <div className="flex items-center gap-2 font-semibold text-[#6b4f2a]">
              <TriangleAlert size={16} aria-hidden="true" />
              Copy this signing secret now — you will not see it again
            </div>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 break-all rounded-md border border-[#e3dccf] bg-white px-3 py-2 text-xs">
                {newSecret}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-[#17453b] px-3 text-sm font-semibold text-white"
              >
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-md border border-[#d8d1c2] bg-white">
        <div className="border-b border-[#e3dccf] px-6 py-4">
          <h2 className="text-lg font-semibold">Configured endpoints</h2>
        </div>
        {endpoints.length === 0 ? (
          <p className="px-6 py-8 text-sm text-[#58665e]">No endpoints yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-[#e3dccf]">
            {endpoints.map((endpoint) => (
              <li key={endpoint.id} className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${endpoint.isActive ? "bg-emerald-500" : "bg-[#b8ad99]"}`}
                      aria-hidden="true"
                    />
                    <span className="break-all">{endpoint.url}</span>
                  </p>
                  <p className="mt-1 text-xs text-[#58665e]">
                    {endpoint.isActive ? "Active" : "Inactive"} · {endpoint.events}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(endpoint)}
                    disabled={busyId === endpoint.id}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-[#b8ad99] bg-white px-3 text-sm font-semibold disabled:opacity-50"
                  >
                    <Power size={15} aria-hidden="true" />
                    {endpoint.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(endpoint.id)}
                    disabled={busyId === endpoint.id}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-[#e0b4b4] bg-white px-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
