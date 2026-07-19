'use client';
import { useState, useEffect } from 'react';
import { Plus, Download, Users, Calendar, MapPin, CheckSquare, Edit2, Trash2, Loader2 } from 'lucide-react';

type OpenHouse = {
  id: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
  specialInstructions?: string;
  visitors: Visitor[];
  property?: { address: string; city: string; state: string };
};

type Visitor = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  interestLevel: string;
  followUpNeeded: boolean;
};

const CHECKLIST = [
  'Set up signage and directional signs',
  'Prepare visitor sign-in sheet',
  'Stage the home (declutter, clean)',
  'Set temperature to comfortable level',
  'Turn on all lights, open curtains',
  'Prepare property fact sheets',
  'Set up refreshments',
  'Test smart home features',
  'Review disclosure documents',
  'Confirm with listing coordinator',
];

export default function OpenHousesPage() {
  const [openHouses, setOpenHouses] = useState<OpenHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedOH, setSelectedOH] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [form, setForm] = useState({ propertyId: '', startDate: '', endDate: '', description: '' });
  const [visitorForm, setVisitorForm] = useState({ firstName: '', lastName: '', email: '', phone: '', interestLevel: 'NEUTRAL', followUpNeeded: false });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/open-houses');
      const data = await res.json();
      if (data.ok) setOpenHouses(data.openHouses);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/open-houses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowForm(false);
    setForm({ propertyId: '', startDate: '', endDate: '', description: '' });
    load();
  };

  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOH) return;
    await fetch(`/api/open-houses/${selectedOH}/visitors`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(visitorForm),
    });
    setVisitorForm({ firstName: '', lastName: '', email: '', phone: '', interestLevel: 'NEUTRAL', followUpNeeded: false });
    load();
  };

  const exportVisitors = (oh: OpenHouse) => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Interest Level', 'Follow Up'].join(','),
      ...oh.visitors.map(v => [`"${v.firstName} ${v.lastName}"`, v.email || '', v.phone || '', v.interestLevel, v.followUpNeeded ? 'Yes' : 'No'].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `visitors-${oh.id}.csv`; a.click();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this open house?')) return;
    await fetch(`/api/open-houses/${id}`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="text-purple-500" /> Open House Manager</h1>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <Plus size={16} /> New Open House
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">Create Open House</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Property ID</label><input type="text" required value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Start Date/Time</label><input type="datetime-local" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">End Date/Time</label><input type="datetime-local" required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {openHouses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No open houses yet. Create one to get started.</div>
      ) : (
        openHouses.map(oh => (
          <div key={oh.id} className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{oh.property?.address || `Property ${oh.propertyId}`}</h3>
                <p className="text-sm text-gray-500">{new Date(oh.startDate).toLocaleString()} — {new Date(oh.endDate).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full ${oh.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' : oh.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' : oh.status === 'COMPLETED' ? 'bg-gray-100' : 'bg-red-100 text-red-800'}`}>{oh.status.replace('_', ' ')}</span>
                <button onClick={() => handleDelete(oh.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <button onClick={() => { setSelectedOH(oh.id); setShowSignIn(true); }} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Users size={14} /> Sign-In Visitor ({oh.visitors.length})
                </button>
                {oh.visitors.length > 0 && (
                  <button onClick={() => exportVisitors(oh)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Download size={14} /> Export Visitors
                  </button>
                )}
              </div>

              {oh.visitors.length > 0 && (
                <div className="mb-4">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left py-2 font-medium">Name</th><th className="text-left py-2 font-medium">Contact</th><th className="text-left py-2 font-medium">Interest</th><th className="text-left py-2 font-medium">Follow Up</th></tr></thead>
                    <tbody className="divide-y">
                      {oh.visitors.map(v => (
                        <tr key={v.id}>
                          <td className="py-2">{v.firstName} {v.lastName}</td>
                          <td className="py-2">{v.email || v.phone || '—'}</td>
                          <td className="py-2">{v.interestLevel.replace('_', ' ')}</td>
                          <td className="py-2">{v.followUpNeeded ? '⚠️ Yes' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <details>
                <summary className="cursor-pointer text-sm font-medium flex items-center gap-1"><CheckSquare size={14} /> Planning Checklist</summary>
                <ul className="mt-2 space-y-1">
                  {CHECKLIST.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><input type="checkbox" className="mt-1" /> {item}</li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        ))
      )}

      {showSignIn && selectedOH && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowSignIn(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Visitor Sign-In</h2>
            <form onSubmit={handleAddVisitor} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">First Name</label><input type="text" required value={visitorForm.firstName} onChange={e => setVisitorForm({ ...visitorForm, firstName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Last Name</label><input type="text" required value={visitorForm.lastName} onChange={e => setVisitorForm({ ...visitorForm, lastName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={visitorForm.email} onChange={e => setVisitorForm({ ...visitorForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input type="tel" value={visitorForm.phone} onChange={e => setVisitorForm({ ...visitorForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Interest Level</label>
                <select value={visitorForm.interestLevel} onChange={e => setVisitorForm({ ...visitorForm, interestLevel: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="VERY_INTERESTED">Very Interested</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="NEUTRAL">Neutral</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                  <option value="JUST_BROWSING">Just Browsing</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visitorForm.followUpNeeded} onChange={e => setVisitorForm({ ...visitorForm, followUpNeeded: e.target.checked })} /> Follow-up needed</label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Sign In</button>
                <button type="button" onClick={() => setShowSignIn(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
