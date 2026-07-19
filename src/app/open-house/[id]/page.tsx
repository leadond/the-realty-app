'use client';
import { use, useEffect, useState } from 'react';
import { Home, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';

type OpenHouseView = {
  id: string;
  status: string;
  property: { address: string; city: string; state: string } | null;
};

export default function OpenHouseSignInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [openHouse, setOpenHouse] = useState<OpenHouseView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', interestLevel: 'INTERESTED' });

  useEffect(() => {
    fetch(`/api/public/open-houses/${id}/signin`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setOpenHouse(data.openHouse);
        else setError(data.error || 'Open house not found');
      })
      .catch(() => setError('Failed to load open house'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const res = await fetch(`/api/public/open-houses/${id}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || 'Failed to sign in');
      setSubmitting(false);
      return;
    }
    setSuccess(true);
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

  if (error && !openHouse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
          <h1 className="text-xl font-semibold mb-2">Thanks for signing in!</h1>
          <p className="text-gray-500 text-sm">Enjoy the open house — feel free to ask the agent any questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md overflow-hidden">
        <div className="p-6 border-b bg-purple-50 text-center">
          <Home className="mx-auto text-purple-600 mb-2" size={28} />
          <h1 className="text-xl font-semibold">Welcome!</h1>
          {openHouse?.property && (
            <p className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
              <MapPin size={14} /> {openHouse.property.address}, {openHouse.property.city}, {openHouse.property.state}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">Please sign in below</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">First Name</label><input required type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Last Name</label><input required type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div>
            <label className="block text-sm font-medium mb-1">How interested are you?</label>
            <select value={form.interestLevel} onChange={e => setForm({ ...form, interestLevel: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="VERY_INTERESTED">Very interested</option>
              <option value="INTERESTED">Interested</option>
              <option value="NEUTRAL">Just browsing</option>
              <option value="JUST_BROWSING">Just curious about the neighborhood</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
