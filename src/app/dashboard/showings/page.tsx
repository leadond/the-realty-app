'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, CalendarClock, Plus, Clock, MapPin, User, CheckCircle, XCircle, Trash2 } from 'lucide-react';

type Showing = {
  id: string;
  propertyId: string;
  scheduledAt: string;
  status: string;
  durationMin: number;
  notes?: string;
  feedback?: string;
  property?: { address: string; city: string; state: string };
  lead?: { firstName: string; lastName: string };
};

type NewShowing = {
  scheduledAt: string;
  propertyId: string;
  leadId: string;
  status: string;
  durationMin: number;
  notes: string;
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
};

export default function ShowingsPage() {
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'daily' | 'weekly'>('weekly');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewShowing>({
    scheduledAt: '',
    propertyId: '',
    leadId: '',
    status: 'SCHEDULED',
    durationMin: 30,
    notes: '',
  });

  const loadShowings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/showings');
      const data = await res.json();
      if (data.ok) setShowings(data.showings);
    } catch (e) {
      console.error('Failed to load showings', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    fetch('/api/showings')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok) setShowings(data.showings);
      })
      .catch((e) => {
        console.error('Failed to load showings', e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/showings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (await res.json().then(d => d.ok)) {
      setShowForm(false);
      setForm({ scheduledAt: '', propertyId: '', leadId: '', status: 'SCHEDULED', durationMin: 30, notes: '' });
      loadShowings();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/showings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadShowings();
  };

  const deleteShowing = async (id: string) => {
    if (!confirm('Delete this showing?')) return;
    await fetch(`/api/showings/${id}`, { method: 'DELETE' });
    loadShowings();
  };

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Showing[]> = {};
    for (const s of showings) {
      const date = new Date(s.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    }
    return groups;
  }, [showings]);

  const filtered = view === 'daily'
    ? Object.entries(groupedByDate).filter(([date]) => date.includes(new Date().toLocaleDateString('en-US')))
    : Object.entries(groupedByDate);

  if (loading) return <div className="p-6">Loading showings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Showing Calendar</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/calendar-sync" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 rounded-md hover:bg-gray-300">
            <CalendarClock size={16} /> Sync to your calendar
          </Link>
          <button onClick={() => setView('daily')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Daily</button>
          <button onClick={() => setView('weekly')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Weekly</button>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Plus size={16} /> Add Showing
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">New Showing</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date & Time</label>
              <input type="datetime-local" required value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Property ID</label>
              <input type="text" required value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Property ID or MLS #" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lead ID (optional)</label>
              <input type="text" value={form.leadId} onChange={e => setForm({ ...form, leadId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option>SCHEDULED</option>
                <option>CONFIRMED</option>
                <option>COMPLETED</option>
                <option>CANCELLED</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (min)</label>
              <input type="number" value={form.durationMin} onChange={e => setForm({ ...form, durationMin: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" min={5} step={5} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No showings found. Add one to get started.</div>
      ) : (
        filtered.map(([date, items]) => (
          <div key={date}>
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={18} /> {date}
            </h3>
            <div className="space-y-3">
              {items.map(s => (
                <div key={s.id} className="bg-white p-4 rounded-lg shadow border flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-sm font-medium">{new Date(s.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-100'}`}>{s.status.replace('_', ' ')}</span>
                    </div>
                    {s.property && (
                      <p className="text-sm flex items-center gap-1"><MapPin size={14} /> {s.property.address}, {s.property.city}, {s.property.state}</p>
                    )}
                    {s.lead && (
                      <p className="text-sm flex items-center gap-1"><User size={14} /> {s.lead.firstName} {s.lead.lastName}</p>
                    )}
                    {s.notes && <p className="text-sm text-gray-500 mt-1">{s.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    {s.status === 'SCHEDULED' && (
                      <button onClick={() => updateStatus(s.id, 'CONFIRMED')} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Confirm"><CheckCircle size={18} /></button>
                    )}
                    {s.status !== 'COMPLETED' && s.status !== 'CANCELLED' && (
                      <>
                        <button onClick={() => updateStatus(s.id, 'COMPLETED')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Complete"><CheckCircle size={18} /></button>
                        <button onClick={() => updateStatus(s.id, 'CANCELLED')} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancel"><XCircle size={18} /></button>
                      </>
                    )}
                    <button onClick={() => deleteShowing(s.id)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Delete"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
