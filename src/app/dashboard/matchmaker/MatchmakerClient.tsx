'use client';
import { useState } from 'react';
import { Search, MapPin, Bed, Bath, Square, Save, Loader2, Sparkles } from 'lucide-react';
import { callAIChat } from '@/lib/ai/provider';

type MatchResult = {
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  matchScore: number;
  pros: string[];
  cons: string[];
  neighborhood: string;
  amenities: string[];
};

export default function MatchmakerPage() {
  const [form, setForm] = useState({
    budgetMin: '',
    budgetMax: '',
    bedrooms: '',
    bathrooms: '',
    minSqft: '',
    maxSqft: '',
    location: '',
    mustHaves: '',
    dealBreakers: '',
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState('');

  const handleFindMatches = async () => {
    setLoading(true);
    setError('');
    setResults([]);
    setAiResponse('');

    const prompt = `You are a real estate property matchmaker AI. Find properties that match these client requirements and return ONLY a JSON array (no markdown, no explanation). Each object should have: address, city, state, price, bedrooms, bathrooms, sqft, matchScore (0-100), pros (array of strings), cons (array of strings), neighborhood (string), amenities (array of strings with distances).

Client Requirements:
- Budget: $${form.budgetMin || '0'} - $${form.budgetMax || 'No limit'}
- Bedrooms: ${form.bedrooms || 'Any'}
- Bathrooms: ${form.bathrooms || 'Any'}
- Square footage: ${form.minSqft || 'Any'} - ${form.maxSqft || 'Any'} sqft
- Location preference: ${form.location || 'Open'}
- Must-haves: ${form.mustHaves || 'None specified'}
- Deal breakers: ${form.dealBreakers || 'None specified'}

Return exactly 5 property matches as a JSON array. Make them realistic for the ${form.location || 'US'} market.`;

    try {
      const response = await callAIChat([
        { role: 'system', content: 'You are a helpful real estate assistant. Return only valid JSON arrays when asked for property matches.' },
        { role: 'user', content: prompt },
      ]);
      setAiResponse(response);

      // Try to parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) setResults(parsed);
        } catch {
          setError('Could not parse AI results. Showing raw response below.');
        }
      } else {
        setError('No structured results found. Showing raw AI response below.');
      }
    } catch (e) {
      setError(`Failed to get matches: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="text-purple-500" /> AI Property Matchmaker
        </h1>
        <p className="text-gray-500 mt-1">Enter client requirements and let AI find the perfect matches</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">Client Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Min Budget ($)</label>
            <input type="number" value={form.budgetMin} onChange={e => setForm({ ...form, budgetMin: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="300000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Budget ($)</label>
            <input type="number" value={form.budgetMax} onChange={e => setForm({ ...form, budgetMax: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="500000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Austin, TX" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bedrooms</label>
            <input type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="3" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bathrooms</label>
            <input type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Min Sqft</label>
            <input type="number" value={form.minSqft} onChange={e => setForm({ ...form, minSqft: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="1500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Sqft</label>
            <input type="number" value={form.maxSqft} onChange={e => setForm({ ...form, maxSqft: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="3000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Must-Haves</label>
            <input type="text" value={form.mustHaves} onChange={e => setForm({ ...form, mustHaves: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Pool, garage, yard" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deal Breakers</label>
            <input type="text" value={form.dealBreakers} onChange={e => setForm({ ...form, dealBreakers: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="No HOA, flood zone" />
          </div>
        </div>
        <button
          onClick={handleFindMatches}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          {loading ? 'Finding Matches...' : 'Find Matches'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-medium">{error}</p>
          {aiResponse && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm">View raw AI response</summary>
              <pre className="mt-2 text-xs bg-red-100 p-3 rounded overflow-auto max-h-64">{aiResponse}</pre>
            </details>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Matched Properties ({results.length})</h2>
          {results.map((prop, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{prop.address}</h3>
                  <p className="text-gray-500 flex items-center gap-1"><MapPin size={14} /> {prop.city}, {prop.state}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">${(prop.price ?? 0).toLocaleString()}</p>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                    (prop.matchScore ?? 0) >= 80 ? 'bg-green-100 text-green-800' :
                    (prop.matchScore ?? 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>Match: {prop.matchScore ?? '?'}%</span>
                </div>
              </div>

              <div className="flex gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1"><Bed size={16} /> {prop.bedrooms ?? '?'} bd</span>
                <span className="flex items-center gap-1"><Bath size={16} /> {prop.bathrooms ?? '?'} ba</span>
                <span className="flex items-center gap-1"><Square size={16} /> {prop.sqft ?? '?'} sqft</span>
              </div>

              <p className="text-sm text-gray-500 mb-3">Neighborhood: {prop.neighborhood || 'N/A'}</p>

              {(prop.amenities?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Nearby Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {prop.amenities.map((a, j) => (
                      <span key={j} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prop.pros?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Pros:</p>
                    <ul className="text-sm space-y-0.5">
                      {prop.pros.map((p, j) => <li key={j} className="flex items-start gap-1"><span className="text-green-500">✓</span> {p}</li>)}
                    </ul>
                  </div>
                )}
                {prop.cons?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-1">Cons:</p>
                    <ul className="text-sm space-y-0.5">
                      {prop.cons.map((c, j) => <li key={j} className="flex items-start gap-1"><span className="text-red-500">✗</span> {c}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <button className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
                <Save size={14} /> Save Match
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
