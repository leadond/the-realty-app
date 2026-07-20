'use client';
import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2, Home, Bed, Bath, Square, MapPin } from 'lucide-react';
import { callAIChat } from '@/lib/ai/provider';

export default function ListingsPage() {
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    lotSize: '',
    yearBuilt: '',
    features: '',
    neighborhood: '',
    style: '',
    tone: 'professional',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!form.address) return;
    setLoading(true);
    setError('');
    setResult('');
    setCopied(false);

    const prompt = `You are an expert real estate copywriter. Write a compelling, SEO-optimized property listing description for:

Property Details:
- Address: ${form.address}${form.city ? `, ${form.city}` : ''}${form.state ? `, ${form.state}` : ''}${form.zip ? ` ${form.zip}` : ''}
- Bedrooms: ${form.bedrooms || 'N/A'}
- Bathrooms: ${form.bathrooms || 'N/A'}
- Square Footage: ${form.sqft || 'N/A'} sqft
- Lot Size: ${form.lotSize || 'N/A'}
- Year Built: ${form.yearBuilt || 'N/A'}
- Style: ${form.style || 'N/A'}
- Neighborhood: ${form.neighborhood || 'N/A'}
- Key Features: ${form.features || 'None specified'}

Tone: ${form.tone}

Write a listing description that includes:
1. A compelling headline (one line)
2. An engaging opening paragraph that hooks buyers
3. Detailed description highlighting the best features
4. Neighborhood/lifestyle appeal
5. A strong call-to-action

Make it professional, persuasive, and optimized for MLS/Zillow/Realtor.com. Use vivid language but stay factual. Include relevant keywords for SEO. Keep it between 200-400 words.`;

    try {
      const response = await callAIChat([
        { role: 'system', content: 'You are an expert real estate copywriter who writes compelling, SEO-optimized listing descriptions that sell homes.' },
        { role: 'user', content: prompt },
      ]);
      setResult(response);
    } catch (e) {
      setError(`Generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="text-green-500" /> Listing Description Generator
        </h1>
        <p className="text-gray-500 mt-1">AI-powered SEO-optimized listing copy that sells</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Home size={14} /> Street Address</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="123 Main St" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">City</label>
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Austin" />
            </div>
            <div className="w-20">
              <label className="block text-sm font-medium mb-1">State</label>
              <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="TX" />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium mb-1">ZIP</label>
              <input type="text" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="78701" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Bed size={14} /> Bedrooms</label>
            <input type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="3" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Bath size={14} /> Bathrooms</label>
            <input type="number" step="0.5" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Square size={14} /> Square Footage</label>
            <input type="number" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="2000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lot Size</label>
            <input type="text" value={form.lotSize} onChange={e => setForm({ ...form, lotSize: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="0.25 acres" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year Built</label>
            <input type="number" value={form.yearBuilt} onChange={e => setForm({ ...form, yearBuilt: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="2020" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Style</label>
            <input type="text" value={form.style} onChange={e => setForm({ ...form, style: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Modern farmhouse" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1"><MapPin size={14} /> Neighborhood</label>
            <input type="text" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Downtown Austin" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Key Features</label>
            <textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Hardwood floors, gourmet kitchen, pool, smart home, energy efficient..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tone</label>
            <select value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="professional">Professional</option>
              <option value="luxury">Luxury</option>
              <option value="casual">Casual & Friendly</option>
              <option value="urgent">Urgent / Hot Deal</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !form.address}
          className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Generating...' : 'Generate Description'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      {result && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
            <h2 className="font-semibold">Generated Listing Description</h2>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          <div className="p-6 prose prose-sm max-w-none">
            {result.split('\n').map((line, i) => {
              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('### ', '')}</h3>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>;
              if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-4 mb-3">{line.replace('# ', '')}</h1>;
              if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 text-sm">{line.replace(/^[-*]\s*/, '')}</li>;
              if (line.trim() === '') return <div key={i} className="h-3" />;
              return <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>;
            })}
          </div>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="text-center py-16">
          <Sparkles size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Enter property details and click Generate to create listing copy</p>
        </div>
      )}
    </div>
  );
}
