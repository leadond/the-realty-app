"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";

type SmsMessage = {
  id: string;
  direction: string;
  body: string;
  status: string;
  createdAt: string;
};

type ThreadLead = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

type ThreadResponse = {
  ok: boolean;
  error?: string;
  lead?: ThreadLead;
  messages?: SmsMessage[];
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SmsThreadView({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<ThreadLead | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/sms/${leadId}`);
      const data: ThreadResponse = await res.json();
      if (data.ok && data.lead) {
        setLead(data.lead);
        setMessages(data.messages ?? []);
      } else {
        setError(data.error || "Failed to load conversation.");
      }
    } catch {
      setError("Failed to load conversation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setSendError("");
    try {
      const res = await fetch(`/api/sms/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (data.ok) {
        setDraft("");
        await load();
      } else {
        setSendError(data.error || "Failed to send message.");
      }
    } catch {
      setSendError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-[#58665e]">Loading conversation...</p>;
  }

  if (error) {
    return (
      <p className="p-6 text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-[#d8d1c2] bg-white px-4 py-3">
        <MessageSquare size={18} className="text-[#17453b]" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-[#17201b]">
            {lead ? `${lead.firstName} ${lead.lastName}` : "Conversation"}
          </h2>
          {lead?.phone && <p className="text-xs text-[#58665e]">{lead.phone}</p>}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f5ef] px-4 py-4" aria-live="polite">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#58665e]">
            No messages yet. Send the first text below.
          </p>
        ) : (
          messages.map((message) => {
            const outbound = message.direction === "OUTBOUND";
            return (
              <div
                key={message.id}
                className={`flex ${outbound ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    outbound
                      ? "bg-[#17453b] text-white"
                      : "border border-[#d8d1c2] bg-white text-[#17201b]"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p
                    className={`mt-1 text-[11px] ${
                      outbound ? "text-white/70" : "text-[#58665e]"
                    }`}
                  >
                    {formatTime(message.createdAt)}
                    {outbound && message.status === "FAILED" && " · Failed"}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-[#d8d1c2] bg-white p-3">
        {sendError && (
          <p className="mb-2 text-xs text-red-600" role="alert">
            {sendError}
          </p>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="sms-draft" className="sr-only">
            Message
          </label>
          <textarea
            id="sms-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="flex-1 resize-none rounded-md border border-[#d8d1c2] px-3 py-2 text-sm focus:border-[#17453b] focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Send size={16} aria-hidden="true" />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
