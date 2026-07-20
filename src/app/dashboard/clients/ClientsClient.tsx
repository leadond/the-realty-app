'use client';
import { useEffect, useState } from 'react';
import { UserCheck, Mail, Phone, Loader2, Sparkles, Copy, Check, Search, MapPin } from 'lucide-react';
import { callAIChat } from '@/lib/ai/provider';

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: string;
  priority: string;
  location?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  timeline?: string;
  notes?: string;
};

const STATUS_COLORS: Record<string, string> = {
  WON: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  QUALIFIED: 'bg-purple-100 text-purple-800',
  NEGOTIATING: 'bg-amber-100 text-amber-800',
  CONTACTED: 'bg-gray-100 text-gray-800',
  NEW: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [update, setUpdate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => { if (d.ok) setClients(d.leads); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const money = (v?: number | null) => (v ? `$${v.toLocaleString()}` : '—');

  const generateUpdate = async (client: Client) => {
    setSelected(client);
    setUpdate('');
    setGenerating(true);
    setCopied(false);

    const prompt = `Write a warm, professional client update message for a real estate client.

Client: ${client.firstName} ${client.lastName}
Status: ${client.status}
Looking in: ${client.location || 'flexible area'}
Budget: ${money(client.budgetMin)} - ${money(client.budgetMax)}
Timeline: ${client.timeline || 'flexible'}
Notes: ${client.notes || 'none'}

Write a personalized check-in message (under 150 words) that reflects where they are in their journey, offers a clear next step, and feels genuine — not templated.`;

    try {
      const result = await callAIChat([
        { role: 'system', content: 'You write warm, personal real estate client communications.' },
        { role: 'user', content: prompt },
      ]);
      setUpdate(result);
    } catch (e) {
      setUpdate(e instanceof Error ? e.message : 'Failed to generate update.');
    }
    setGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(update);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = clients.filter(c =>
    !search || `${c.firstName} ${c.lastName} ${c.email ?? ''} ${c.location ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <div className="p-6">Loading clients...</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><UserCheck className="text-teal-500" /> Client Portal</h1>
        <p className="text-gray-500 mt-1">Your active clients with AI-assisted personalized updates</p>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(client => (
          <div key={client.id} className="bg-white p-5 rounded-lg shadow border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{client.firstName} {client.lastName}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[client.status] || 'bg-gray-100 text-gray-800'}`}>
                    {client.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
              {client.email && <span className="flex items-center gap-1.5 truncate"><Mail size={14} /> {client.email}</span>}
              {client.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {client.phone}</span>}
              {client.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {client.location}</span>}
              <span>{money(client.budgetMin)} - {money(client.budgetMax)}</span>
            </div>

            <button
              onClick={() => generateUpdate(client)}
              disabled={generating && selected?.id === client.id}
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {generating && selected?.id === client.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate Update
            </button>

            {selected?.id === client.id && update && (
              <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg relative">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{update}</p>
                <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-white rounded shadow hover:bg-gray-100">
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">No clients found. Add leads in the Lead Tracker to see them here.</div>
      )}
    </div>
  );
}
