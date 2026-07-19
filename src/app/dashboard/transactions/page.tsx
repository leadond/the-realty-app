'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckSquare, AlertCircle, Calendar, DollarSign, Home, FileText, Loader2 } from 'lucide-react';

type Transaction = {
  id: string;
  type: string;
  status: string;
  price?: number;
  closingDate?: string;
  commission?: number;
  agentNotes?: string;
  checklist: ChecklistItem[];
  property?: { address: string; city: string; state: string };
};

type ChecklistItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  category: string;
};

const STATUS_FLOW = ['INITIATED', 'UNDER_CONTRACT', 'IN_ESCROW', 'INSPECTION', 'FINANCING', 'NEGOTIATING_REPAIRS', 'PRE_CLOSING', 'CLOSED'];

const PHASE_CHECKLISTS: Record<string, string[]> = {
  INITIATED: ['Prepare offer letter', 'Submit earnest money deposit', 'Order title search', 'Review disclosure documents'],
  UNDER_CONTRACT: ['Notify all parties of accepted offer', 'Schedule home inspection', 'Order appraisal', 'Apply for financing'],
  IN_ESCROW: ['Open escrow account', 'Transfer earnest money', 'Order title insurance', 'Review escrow instructions'],
  INSPECTION: ['Schedule general inspection', 'Schedule pest inspection', 'Review inspection reports', 'Negotiate repairs if needed'],
  FINANCING: ['Submit loan application', 'Provide documentation to lender', 'Receive loan approval', 'Review loan estimate'],
  NEGOTIATING_REPAIRS: ['Get repair estimates', 'Negotiate with seller', 'Schedule re-inspection', 'Document agreements'],
  PRE_CLOSING: ['Order final walkthrough', 'Review closing disclosure', 'Arrange homeowner insurance', 'Transfer funds for closing'],
  CLOSED: ['Record deed', 'Transfer keys', 'Send closing documents to client', 'Request review/testimonial'],
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ propertyId: '', type: 'PURCHASE', price: '', closingDate: '', agentNotes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (data.ok) setTransactions(data.transactions);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/transactions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: form.price ? Number(form.price) : null }),
    });
    setShowForm(false);
    setForm({ propertyId: '', type: 'PURCHASE', price: '', closingDate: '', agentNotes: '' });
    load();
  };

  const advanceStatus = async (id: string, currentStatus: string) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx < STATUS_FLOW.length - 1) {
      await fetch(`/api/transactions/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: STATUS_FLOW[idx + 1] }),
      });
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div className="p-6">Loading transactions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="text-indigo-500" /> Transaction Management</h1>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={16} /> New Transaction
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">Create Transaction</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Property ID</label><input type="text" value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option>PURCHASE</option><option>SALE</option><option>RENTAL</option><option>REFINANCE</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Price ($)</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Closing Date</label><input type="date" value={form.closingDate} onChange={e => setForm({ ...form, closingDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Notes</label><textarea value={form.agentNotes} onChange={e => setForm({ ...form, agentNotes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No transactions yet.</div>
      ) : (
        transactions.map(tx => {
          const statusIdx = STATUS_FLOW.indexOf(tx.status);
          return (
            <div key={tx.id} className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{tx.property?.address || `Transaction #${tx.id.slice(0, 8)}`}</h3>
                  <div className="flex gap-3 text-sm text-gray-500 mt-1">
                    <span><DollarSign size={14} className="inline" /> {tx.price ? `$${tx.price.toLocaleString()}` : 'N/A'}</span>
                    <span><Calendar size={14} className="inline" /> {tx.closingDate ? new Date(tx.closingDate).toLocaleDateString() : 'No date'}</span>
                    <span className="uppercase">{tx.type}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(tx.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>

              {/* Status Progress Bar */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {STATUS_FLOW.map((s, i) => (
                    <div key={s} className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i <= statusIdx ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {i < statusIdx ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs ml-1 mr-2 whitespace-nowrap ${i <= statusIdx ? 'font-medium text-indigo-700' : 'text-gray-400'}`}>{s.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
                {statusIdx < STATUS_FLOW.length - 1 && (
                  <button onClick={() => advanceStatus(tx.id, tx.status)} className="mt-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Advance to {STATUS_FLOW[statusIdx + 1].replace(/_/g, ' ')} →
                  </button>
                )}
              </div>

              {/* Checklist */}
              <div className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2"><CheckSquare size={16} /> {tx.status.replace(/_/g, ' ')} Checklist</h4>
                <div className="space-y-2">
                  {(PHASE_CHECKLISTS[tx.status] || []).map((item, i) => (
                    <label key={i} className="flex items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-1" defaultChecked={tx.checklist.some(c => c.title === item && c.isCompleted)} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>

                {/* Deadline Alert */}
                {tx.closingDate && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} className="text-yellow-600" />
                    <span className="text-sm text-yellow-700">Closing: {new Date(tx.closingDate).toLocaleDateString()} ({Math.max(0, Math.ceil((new Date(tx.closingDate).getTime() - Date.now()) / 86400000))} days remaining)</span>
                  </div>
                )}

                {/* Document Links */}
                {tx.agentNotes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600"><FileText size={14} className="inline" /> Notes: {tx.agentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
