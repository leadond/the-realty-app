'use client';
import { useEffect, useState } from 'react';
import { Home, Plus, Trash2, Bed, Bath, Square, MapPin } from 'lucide-react';

type Property = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft?: number | null;
  propertyType: string;
  status: string;
  description?: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-amber-100 text-amber-800',
  SOLD: 'bg-gray-100 text-gray-800',
  OFF_MARKET: 'bg-red-100 text-red-800',
  COMING_SOON: 'bg-blue-100 text-blue-800',
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    address: '', city: '', state: '', zip: '', price: '', bedrooms: '', bathrooms: '', sqft: '',
    propertyType: 'SINGLE_FAMILY', status: 'ACTIVE', description: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (data.ok) setProperties(data.properties);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ address: '', city: '', state: '', zip: '', price: '', bedrooms: '', bathrooms: '', sqft: '', propertyType: 'SINGLE_FAMILY', status: 'ACTIVE', description: '' });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await fetch(`/api/properties/${id}`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div className="p-6">Loading properties...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Home className="text-blue-500" /> Properties</h1>
          <p className="text-gray-500 mt-1">Your listings — used across showings, open houses, and matchmaker</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Add Listing
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">New Listing</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3"><label className="block text-sm font-medium mb-1">Address</label><input required type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="123 Main St" /></div>
            <div><label className="block text-sm font-medium mb-1">City</label><input required type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">State</label><input required type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">ZIP</label><input required type="text" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Price ($)</label><input required type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Bedrooms</label><input type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Bathrooms</label><input type="number" step="0.5" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Sqft</label><input type="number" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="SINGLE_FAMILY">Single Family</option>
                <option value="CONDO">Condo</option>
                <option value="TOWNHOUSE">Townhouse</option>
                <option value="MULTI_FAMILY">Multi-Family</option>
                <option value="LAND">Land</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="md:col-span-3"><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Listing</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No listings yet. Add one to start scheduling showings and open houses.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{p.address}</h3>
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-2"><MapPin size={14} /> {p.city}, {p.state} {p.zip}</p>
                <p className="text-xl font-bold text-green-600 mb-2">${p.price.toLocaleString()}</p>
                <div className="flex gap-3 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1"><Bed size={14} /> {p.bedrooms}</span>
                  <span className="flex items-center gap-1"><Bath size={14} /> {p.bathrooms}</span>
                  {p.sqft && <span className="flex items-center gap-1"><Square size={14} /> {p.sqft} sqft</span>}
                </div>
                <select
                  value={p.status}
                  onChange={e => updateStatus(p.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-full border-0 font-semibold ${STATUS_COLORS[p.status] || 'bg-gray-100'}`}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="SOLD">Sold</option>
                  <option value="OFF_MARKET">Off Market</option>
                  <option value="COMING_SOON">Coming Soon</option>
                </select>
                <p className="mt-2 text-xs text-gray-400 font-mono">ID: {p.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
