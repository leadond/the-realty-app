'use client';
import { useEffect, useState } from 'react';
import { Briefcase, Users, DollarSign, Home, AlertTriangle, UserPlus, Copy, Check, X } from 'lucide-react';

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  leadCount: number;
  propertyCount: number;
  closedDeals: number;
  totalCommission: number;
};

type Summary = {
  members: Member[];
  leads: { id: string; firstName: string; lastName: string; status: string; priority: string; budgetMax: number | null; riskLevel: string | null }[];
  properties: { id: string; address: string; city: string; state: string; price: number; status: string }[];
  pendingContracts: number;
  totals: {
    memberCount: number;
    leadCount: number;
    propertyCount: number;
    totalPipelineValue: number;
    totalCommission: number;
    highRiskLeads: number;
  };
};

export default function BrokerDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/org/summary');
      const data = await res.json();
      if (data.ok) setSummary(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteLink('');
    const res = await fetch('/api/org/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    if (!data.ok) {
      setInviteError(data.error || 'Failed to create invite');
      return;
    }
    const link = `${window.location.origin}/register?invite=${data.invite.token}`;
    setInviteLink(link);
    setInviteEmail('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-6">Loading broker dashboard...</div>;
  if (!summary) return <div className="p-6">Unable to load broker dashboard.</div>;

  const { members, leads, properties, pendingContracts, totals } = summary;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="text-indigo-600" /> Broker Dashboard</h1>
          <p className="text-gray-500 mt-1">Team performance and pipeline across your whole brokerage</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <UserPlus size={16} /> Invite Agent
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500 flex items-center gap-1"><Users size={14} /> Agents</p>
          <p className="text-2xl font-bold">{totals.memberCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="text-2xl font-bold">{totals.leadCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500 flex items-center gap-1"><Home size={14} /> Listings</p>
          <p className="text-2xl font-bold">{totals.propertyCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500 flex items-center gap-1"><DollarSign size={14} /> Pipeline Value</p>
          <p className="text-2xl font-bold">${Math.round(totals.totalPipelineValue / 1000)}k</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Commission (closed)</p>
          <p className="text-2xl font-bold text-green-600">${totals.totalCommission.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500 flex items-center gap-1"><AlertTriangle size={14} className="text-red-500" /> High-Risk Leads</p>
          <p className="text-2xl font-bold text-red-600">{totals.highRiskLeads}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b bg-gray-50"><h2 className="font-semibold">Team Performance</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2 font-medium">Agent</th>
                <th className="text-left px-4 py-2 font-medium">Role</th>
                <th className="text-left px-4 py-2 font-medium">Leads</th>
                <th className="text-left px-4 py-2 font-medium">Listings</th>
                <th className="text-left px-4 py-2 font-medium">Closed Deals</th>
                <th className="text-left px-4 py-2 font-medium">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map(m => (
                <tr key={m.id}>
                  <td className="px-4 py-2 font-medium">{m.name || m.email}</td>
                  <td className="px-4 py-2">{m.role}</td>
                  <td className="px-4 py-2">{m.leadCount}</td>
                  <td className="px-4 py-2">{m.propertyCount}</td>
                  <td className="px-4 py-2">{m.closedDeals}</td>
                  <td className="px-4 py-2 text-green-600">${m.totalCommission.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold">All Team Leads</h2>
            {pendingContracts > 0 && <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">{pendingContracts} contracts pending signature</span>}
          </div>
          <div className="divide-y max-h-80 overflow-auto">
            {leads.slice(0, 20).map(l => (
              <div key={l.id} className="px-4 py-2 flex items-center justify-between text-sm">
                <span>{l.firstName} {l.lastName}</span>
                <div className="flex items-center gap-2">
                  {l.riskLevel === 'RED' && <AlertTriangle size={14} className="text-red-500" />}
                  <span className="text-gray-500">{l.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
            {leads.length === 0 && <p className="px-4 py-6 text-center text-gray-400 text-sm">No leads yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-gray-50"><h2 className="font-semibold">Shared Properties</h2></div>
          <div className="divide-y max-h-80 overflow-auto">
            {properties.slice(0, 20).map(p => (
              <div key={p.id} className="px-4 py-2 flex items-center justify-between text-sm">
                <span>{p.address}, {p.city}</span>
                <span className="text-gray-500">${p.price.toLocaleString()}</span>
              </div>
            ))}
            {properties.length === 0 && <p className="px-4 py-6 text-center text-gray-400 text-sm">No listings yet</p>}
          </div>
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setShowInvite(false); setInviteLink(''); setInviteError(''); }}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Invite an Agent</h2>
              <button onClick={() => { setShowInvite(false); setInviteLink(''); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {!inviteLink ? (
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Agent's Email</label>
                  <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="agent@example.com" />
                </div>
                {inviteError && <p className="text-red-500 text-sm">{inviteError}</p>}
                <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Generate Invite Link</button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Share this link with your agent. It expires in 14 days.</p>
                <div className="flex gap-2">
                  <input readOnly value={inviteLink} className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50" />
                  <button onClick={handleCopy} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
