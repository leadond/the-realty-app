'use client';
import { useState } from 'react';
import { TrendingUp, Loader2, Home, Copy, Check, DollarSign } from 'lucide-react';
import { callAIChat } from '@/lib/ai/provider';

export default function ValuationPage() {
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    yearBuilt: '',
    condition: 'good',
    lotSize: '',
    recentUpdates: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleEstimate = async () => {
    if (!form.address) return;
    setLoading(true);
    setError('');
    setResult('');
    setCopied(false);

    const prompt = `You are a real estate valuation expert producing a Comparative Market Analysis (CMA). Estimate the market value for this property and explain your reasoning.

Property:
- Address: ${form.address}${form.city ? `, ${form.city}` : ''}${form.state ? `, ${form.state}` : ''}
- Bedrooms: ${form.bedrooms || 'N/A'}
- Bathrooms: ${form.bathrooms || 'N/A'}
- Square footage: ${form.sqft || 'N/A'}
- Year built: ${form.yearBuilt || 'N/A'}
- Lot size: ${form.lotSize || 'N/A'}
- Condition: ${form.condition}
- Recent updates: ${form.recentUpdates || 'None noted'}

Provide:
1. **Estimated Value Range** — a low, likely, and high estimate (clearly formatted)
2. **Price Per Square Foot** — estimated for this area
3. **Comparable Sales** — 3 realistic recent comps with address, price, beds/baths, sqft, and sale date
4. **Value Drivers** — features that raise this home's value
5. **Value Detractors** — factors that may lower it
6. **Pricing Strategy** — recommended list price and reasoning for the current market

Be specific and realistic for the ${form.city || form.state || 'local'} market. Format in clear markdown with headers.`;

    try {
      const response = await callAIChat([
        { role: 'system', content: 'You are an expert real estate appraiser and CMA analyst. Provide detailed, realistic, data-driven valuations.' },
        { role: 'user', content: prompt },
      ]);
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Valuation failed');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="text-emerald-500" /> Property Valuation</h1>
        <p className="text-gray-500 mt-1">AI-powered CMA and market value estimates</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Home size={18} /> Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Street Address</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="123 Main St" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Austin" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="TX" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lot Size</label>
            <input type="text" value={form.lotSize} onChange={e => setForm({ ...form, lotSize: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="0.25 acres" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bedrooms</label>
            <input type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="3" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bathrooms</label>
            <input type="number" step="0.5" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Square Footage</label>
            <input type="number" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="2000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year Built</label>
            <input type="number" value={form.yearBuilt} onChange={e => setForm({ ...form, yearBuilt: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="2005" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="excellent">Excellent / Renovated</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="needs-work">Needs Work</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Recent Updates / Upgrades</label>
            <textarea value={form.recentUpdates} onChange={e => setForm({ ...form, recentUpdates: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="New roof 2022, remodeled kitchen, solar panels..." />
          </div>
        </div>
        <button
          onClick={handleEstimate}
          disabled={loading || !form.address}
          className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <DollarSign size={18} />}
          {loading ? 'Analyzing...' : 'Estimate Value'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>}

      {result && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-emerald-50 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><TrendingUp size={18} className="text-emerald-600" /> Valuation Report</h2>
            <button onClick={handleCopy} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-6 prose prose-sm max-w-none">
            {result.split('\n').map((line, i) => {
              if (line.startsWith('#### ')) return <h4 key={i} className="text-base font-bold mt-4 mb-2">{line.replace('#### ', '')}</h4>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-5 mb-2 text-gray-900">{line.replace(/^### \d*\.?\s*/, '')}</h3>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-5 mb-3">{line.replace('## ', '')}</h2>;
              if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 text-sm text-gray-700">{line.replace(/^[-*]\s*/, '')}</li>;
              if (line.trim() === '') return <div key={i} className="h-2" />;
              return <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>;
            })}
          </div>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="text-center py-16">
          <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Enter property details to generate a valuation estimate</p>
        </div>
      )}
    </div>
  );
}
