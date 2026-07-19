'use client';
import { useEffect, useState } from 'react';
import { Send, Plus, X, Users, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

type Campaign = {
  id: string;
  name: string;
  subject: string;
  body: string;
  segment: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  _count?: { sends: number };
};

const QUICK_TEMPLATES = [
  { name: 'New Listing Announcement', subject: 'Just Listed: A home you might love!', body: 'Hi {{first_name}},\n\nI wanted to personally let you know about a new listing that fits what you\'re looking for.\n\nWould you like to schedule a private showing this week?\n\nBest,\nYour Agent' },
  { name: 'Post-Showing Follow-Up', subject: 'Following up on your recent showing', body: 'Hi {{first_name}},\n\nThank you for taking the time to view the property with me. I\'d love to hear your thoughts — what did you like, and what gave you pause?\n\nHappy to set up another showing or adjust your search criteria.\n\nBest,\nYour Agent' },
  { name: 'Market Update', subject: 'Your monthly market update', body: 'Hi {{first_name}},\n\nHere\'s a quick update on how the market is moving in your target area. Prices and inventory have been shifting — happy to walk you through what it means for your search.\n\nLet me know if you\'d like to chat.\n\nBest,\nYour Agent' },
  { name: 'Re-engagement', subject: 'Still thinking about your next move?', body: 'Hi {{first_name}},\n\nIt\'s been a little while since we connected. I wanted to check in and see if your home search is still active, or if your needs have changed.\n\nI\'m here whenever you\'re ready.\n\nBest,\nYour Agent' },
];

const emptyForm = { name: '', subject: '', body: '', status: '', priority: '', source: '' };

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email/campaigns');
      const data = await res.json();
      if (data.ok) setCampaigns(data.campaigns);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const segment = { status: form.status || undefined, priority: form.priority || undefined, source: form.source || undefined };
    const res = await fetch('/api/email/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, subject: form.subject, body: form.body, segment }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setShowForm(false);
      setForm(emptyForm);
      load();
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Send this campaign now to all matching leads?')) return;
    setSendingId(id);
    setMessage('');
    const res = await fetch(`/api/email/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send' }),
    });
    const data = await res.json();
    setSendingId(null);
    if (data.ok) {
      setMessage(`Sent to ${data.sentCount} recipient(s)${data.failedCount ? `, ${data.failedCount} failed` : ''}.`);
    } else {
      setMessage(data.error || 'Failed to send campaign');
    }
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    await fetch(`/api/email/campaigns/${id}`, { method: 'DELETE' });
    load();
  };

  const applyTemplate = (t: typeof QUICK_TEMPLATES[0]) => {
    setForm(prev => ({ ...prev, name: t.name, subject: t.subject, body: t.body }));
  };

  if (loading) return <div className="p-6">Loading campaigns...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Send className="text-blue-500" /> Email Campaigns</h1>
          <p className="text-gray-500 mt-1">Segment your leads and send targeted email blasts</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {message && <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">{message}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">New Campaign</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Quick start from a template:</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_TEMPLATES.map(t => (
                    <button key={t.name} type="button" onClick={() => applyTemplate(t)} className="text-left p-2 text-xs border rounded-lg hover:border-blue-400">{t.name}</button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <div><label className="block text-sm font-medium mb-1">Campaign Name</label><input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Subject Line</label><input required type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Body <span className="text-gray-400 font-normal">({'{{first_name}}'} and {'{{client_name}}'} will be personalized)</span></label><textarea required value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={6} /></div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2 flex items-center gap-1"><Users size={14} /> Recipient Segment</p>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-2 py-1.5 border rounded-lg text-sm">
                      <option value="">Any status</option>
                      <option>NEW</option><option>CONTACTED</option><option>QUALIFIED</option><option>ACTIVE</option><option>NEGOTIATING</option><option>WON</option><option>LOST</option>
                    </select>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="px-2 py-1.5 border rounded-lg text-sm">
                      <option value="">Any priority</option>
                      <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
                    </select>
                    <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="px-2 py-1.5 border rounded-lg text-sm">
                      <option value="">Any source</option>
                      <option>WEBSITE</option><option>REFERRAL</option><option>SOCIAL_MEDIA</option><option>OPEN_HOUSE</option><option>ZILLOW</option><option>REDFIN</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Only leads with an email address on file will receive this campaign.</p>
                </div>

                <button type="submit" disabled={saving} className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save as Draft'}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No campaigns yet. Create one to reach your leads.</div>
      ) : (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">Campaign</th>
                <th className="text-left px-4 py-3 font-medium">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Sends</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                      c.status === 'SENT' ? 'bg-green-100 text-green-800' :
                      c.status === 'SENDING' ? 'bg-blue-100 text-blue-800' :
                      c.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {c.status === 'SENT' && <CheckCircle size={12} />}
                      {c.status === 'FAILED' && <XCircle size={12} />}
                      {c.status === 'DRAFT' && <Clock size={12} />}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c._count?.sends ?? 0}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {c.status === 'DRAFT' && (
                      <button onClick={() => handleSend(c.id)} disabled={sendingId === c.id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mr-2">
                        <Send size={12} /> {sendingId === c.id ? 'Sending...' : 'Send'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(c.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">Sending requires a RESEND_API_KEY environment variable. Campaigns can be created and saved without it — sending will show a clear setup message until it's configured.</p>
    </div>
  );
}
