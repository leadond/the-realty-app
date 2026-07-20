"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { SPLIT_ROLES, type SplitRole } from "@/lib/commissions";

export type SplitView = {
  id: string;
  role: string;
  splitPercent: number;
  splitAmount: number | null;
  notes: string | null;
  agentName: string;
};

export type TransactionOption = {
  id: string;
  label: string;
};

export type SplitGroup = {
  transactionId: string;
  label: string;
  gross: number;
  splits: SplitView[];
};

type Props = {
  transactions: TransactionOption[];
  groups: SplitGroup[];
};

const ROLE_LABEL: Record<SplitRole, string> = {
  REFERRING: "Referring agent",
  CO_LISTING: "Co-listing agent",
  CO_BUYING: "Co-buying agent",
  TRANSACTION_COORDINATOR: "Transaction coordinator",
};

function money(value: number | null) {
  if (value == null) return "—";
  return `$${Math.round(value).toLocaleString()}`;
}

export default function CommissionSplitForm({ transactions, groups }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [addTransactionId, setAddTransactionId] = useState(transactions[0]?.id ?? "");
  const [addRole, setAddRole] = useState<SplitRole>("REFERRING");
  const [addPercent, setAddPercent] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addNotes, setAddNotes] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPercent, setEditPercent] = useState("");
  const [editNotes, setEditNotes] = useState("");

  async function request(url: string, init: RequestInit): Promise<boolean> {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!addTransactionId) {
      setError("Select a transaction first.");
      return;
    }
    const ok = await request("/api/commission-splits", {
      method: "POST",
      body: JSON.stringify({
        transactionId: addTransactionId,
        role: addRole,
        splitPercent: Number(addPercent),
        agentEmail: addEmail.trim() || undefined,
        notes: addNotes.trim() || undefined,
      }),
    });
    if (ok) {
      setAddPercent("");
      setAddEmail("");
      setAddNotes("");
    }
  }

  function startEdit(split: SplitView) {
    setEditingId(split.id);
    setEditPercent(String(split.splitPercent));
    setEditNotes(split.notes ?? "");
  }

  async function handleEditSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    const ok = await request(`/api/commission-splits/${editingId}`, {
      method: "PATCH",
      body: JSON.stringify({ splitPercent: Number(editPercent), notes: editNotes.trim() }),
    });
    if (ok) setEditingId(null);
  }

  async function handleDelete(id: string) {
    await request(`/api/commission-splits/${id}`, { method: "DELETE" });
  }

  const inputClass =
    "w-full rounded-md border border-[#d8d1c2] bg-white px-3 py-2 text-sm focus:border-[#17453b] focus:outline-none focus:ring-1 focus:ring-[#17453b]";

  return (
    <div>
      {error && (
        <p role="alert" aria-live="polite" className="mb-4 rounded-md border border-[#e0b4a8] bg-[#f7e9e4] px-4 py-3 text-sm text-[#8a3b28]">
          {error}
        </p>
      )}

      <section className="rounded-md border border-[#d8d1c2] bg-white p-5">
        <h2 className="text-lg font-semibold">Add a commission split</h2>
        {transactions.length === 0 ? (
          <p className="mt-2 text-sm text-[#58665e]">
            You have no transactions yet. Create a transaction before adding splits.
          </p>
        ) : (
          <form onSubmit={handleAdd} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="split-transaction" className="block text-sm font-medium">Transaction</label>
              <select
                id="split-transaction"
                value={addTransactionId}
                onChange={(e) => setAddTransactionId(e.target.value)}
                className={`mt-1 ${inputClass}`}
              >
                {transactions.map((tx) => (
                  <option key={tx.id} value={tx.id}>{tx.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="split-role" className="block text-sm font-medium">Role</label>
              <select
                id="split-role"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as SplitRole)}
                className={`mt-1 ${inputClass}`}
              >
                {SPLIT_ROLES.map((role) => (
                  <option key={role} value={role}>{ROLE_LABEL[role]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="split-percent" className="block text-sm font-medium">Split percent</label>
              <input
                id="split-percent"
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                required
                value={addPercent}
                onChange={(e) => setAddPercent(e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="split-email" className="block text-sm font-medium">
                Agent email <span className="font-normal text-[#58665e]">(optional)</span>
              </label>
              <input
                id="split-email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="Teammate or external referral partner"
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="split-notes" className="block text-sm font-medium">
                Notes <span className="font-normal text-[#58665e]">(optional)</span>
              </label>
              <input
                id="split-notes"
                type="text"
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Plus size={16} aria-hidden="true" />
                Add split
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-6 space-y-5">
        {groups.length === 0 ? (
          <div className="rounded-md border border-[#d8d1c2] bg-white p-8 text-center text-sm text-[#58665e]">
            No commission splits yet. Add one above to divide commission with a referral or co-broke partner.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.transactionId} className="overflow-hidden rounded-md border border-[#d8d1c2] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3dccf] bg-[#fcfbf7] px-4 py-3">
                <h3 className="font-semibold">{group.label}</h3>
                <span className="text-sm text-[#58665e]">Gross commission {money(group.gross)}</span>
              </div>
              <ul className="divide-y divide-[#e3dccf]">
                {group.splits.map((split) => (
                  <li key={split.id} className="px-4 py-4">
                    {editingId === split.id ? (
                      <form onSubmit={handleEditSave} className="flex flex-wrap items-end gap-3">
                        <div>
                          <label htmlFor={`edit-percent-${split.id}`} className="block text-xs font-medium">Split percent</label>
                          <input
                            id={`edit-percent-${split.id}`}
                            type="number"
                            min={0.01}
                            max={100}
                            step={0.01}
                            required
                            value={editPercent}
                            onChange={(e) => setEditPercent(e.target.value)}
                            className={`mt-1 w-28 ${inputClass}`}
                          />
                        </div>
                        <div className="grow">
                          <label htmlFor={`edit-notes-${split.id}`} className="block text-xs font-medium">Notes</label>
                          <input
                            id={`edit-notes-${split.id}`}
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className={`mt-1 ${inputClass}`}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={pending}
                          className="inline-flex h-10 items-center rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex h-10 items-center gap-1 rounded-md border border-[#b8ad99] bg-white px-3 text-sm font-semibold"
                        >
                          <X size={16} aria-hidden="true" />
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {ROLE_LABEL[split.role as SplitRole] ?? split.role}
                            <span className="ml-2 font-normal text-[#58665e]">{split.agentName}</span>
                          </p>
                          <p className="mt-1 text-sm text-[#58665e]">
                            {split.splitPercent}% · {money(split.splitAmount)}
                            {split.notes ? ` · ${split.notes}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(split)}
                            className="inline-flex h-9 items-center gap-1 rounded-md border border-[#b8ad99] bg-white px-3 text-sm font-semibold"
                          >
                            <Pencil size={15} aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(split.id)}
                            disabled={pending}
                            className="inline-flex h-9 items-center gap-1 rounded-md border border-[#e0b4a8] bg-white px-3 text-sm font-semibold text-[#8a3b28] disabled:opacity-60"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
