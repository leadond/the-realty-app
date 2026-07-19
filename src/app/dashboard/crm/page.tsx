'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Upload, Search, Filter, Mail, Phone, Trash2, Plus, X } from 'lucide-react';
import { RiskAlert } from '@/components/RiskAlert';
import CallButton from '@/components/CallButton';

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  priority: string;
  notes?: string;
};

type RiskInfo = {
  riskLevel: 'GREEN' | 'YELLOW' | 'RED';
  riskScore: number;
  warnings: string[];
  contactedByOrgs: number;
  contactedByAgents: number;
};

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', source: 'WEBSITE', status: 'NEW', priority: 'MEDIUM', notes: '' };

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [importing, setImporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [riskAlert, setRiskAlert] = useState<RiskInfo | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.ok) setLeads(data.leads);
    } catch (e) {
      console.error('Failed to load leads', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok) setLeads(data.leads);
      })
      .catch((e) => {
        console.error('Failed to load leads', e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setRiskAlert(null);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setForm(emptyForm);
        if (data.riskAlert) {
          setRiskAlert(data.riskAlert);
        } else {
          setShowForm(false);
        }
        loadLeads();
      }
    } catch (e) {
      console.error('Failed to create lead', e);
    }
    setSaving(false);
  };

  const handleExport = () => {
    window.open('/api/crm/export', '_blank');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const res = await fetch('/api/crm/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent: text }),
    });
    const data = await res.json();
    if (data.ok) {
      alert(`Imported ${data.imported} contacts`);
      loadLeads();
    }
    setImporting(false);
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    loadLeads();
  };

  const filtered = leads.filter(l => {
    const matchSearch = !search || `${l.firstName} ${l.lastName} ${l.email ?? ''} ${l.phone ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="p-6">Loading CRM...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">CRM</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            <Plus size={16} /> Add Contact
          </button>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer">
            <Upload size={16} /> Import CSV
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={importing} />
          </label>
          <button onClick={handleExport} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setRiskAlert(null); }}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Contact</h2>
              <button onClick={() => { setShowForm(false); setRiskAlert(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {riskAlert && <div className="mb-4"><RiskAlert risk={riskAlert} /></div>}

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">First Name</label><input required type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Last Name</label><input required type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option>WEBSITE</option><option>REFERRAL</option><option>SOCIAL_MEDIA</option><option>OPEN_HOUSE</option><option>COLD_CALL</option><option>ZILLOW</option><option>REDFIN</option><option>OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option>NEW</option><option>CONTACTED</option><option>QUALIFIED</option><option>ACTIVE</option><option>NEGOTIATING</option><option>WON</option><option>LOST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Contact'}</button>
                <button type="button" onClick={() => { setShowForm(false); setRiskAlert(null); }} className="px-4 py-2 bg-gray-200 rounded-lg">Close</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-lg"
          />
        </div>
        <div className="relative">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="pl-10 pr-8 py-2 border rounded-lg appearance-none bg-white"
          >
            <option value="">All Statuses</option>
            <option>NEW</option>
            <option>CONTACTED</option>
            <option>QUALIFIED</option>
            <option>ACTIVE</option>
            <option>NEGOTIATING</option>
            <option>WON</option>
            <option>LOST</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-500">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-500">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-500">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-500">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/dashboard/leads/${lead.id}`} className="hover:text-indigo-600 hover:underline">
                      {lead.firstName} {lead.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm flex items-center gap-1"><Mail size={14} className="text-gray-400" /> {lead.email || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {lead.phone ? (
                      <CallButton leadId={lead.id} phoneNumber={lead.phone} contactName={`${lead.firstName} ${lead.lastName}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline" />
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400"><Phone size={14} /> —</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{lead.source.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      lead.status === 'WON' ? 'bg-green-100 text-green-800' :
                      lead.status === 'LOST' ? 'bg-red-100 text-red-800' :
                      lead.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'QUALIFIED' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{lead.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      lead.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                      lead.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      lead.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{lead.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate">{lead.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteLead(lead.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">No contacts found</div>
        )}
      </div>

      <p className="text-sm text-gray-500">{filtered.length} of {leads.length} contacts shown</p>
    </div>
  );
}
