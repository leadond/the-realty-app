'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Loader2, MapPin, Home, Users, TrendingUp, MessageSquare, AlertCircle, Send } from 'lucide-react';
import { callOllamaChat } from '@/lib/ai/provider';

type Showing = {
  id: string;
  scheduledAt: string;
  status: string;
  property?: { address: string; city: string; state: string; bedrooms: number; bathrooms: number; sqft?: number; price: number };
  lead?: { firstName: string; lastName: string };
};

export default function ShowingAssistantPage() {
  const [showings, setShowings] = useState<Showing[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/showings').then(r => r.json()).then(d => { if (d.ok) setShowings(d.showings); });
  }, []);

  const selectedShowing = showings.find(s => s.id === selectedId);

  const handleGenerateBriefing = async () => {
    if (!selectedShowing) return;
    setLoading(true);
    setError('');
    setBriefing('');

    const prop = selectedShowing.property;
    const prompt = `You are an expert real estate showing assistant. Generate a comprehensive pre-showing briefing for this property:

${prop ? `${prop.address}, ${prop.city}, ${prop.state}
Price: $${prop.price.toLocaleString()}
Beds: ${prop.bedrooms} | Baths: ${prop.bathrooms} | Sqft: ${prop.sqft ?? 'N/A'}` : 'Property details not available'}

Client: ${selectedShowing.lead ? `${selectedShowing.lead.firstName} ${selectedShowing.lead.lastName}` : 'Walk-in client'}

Provide:
1. **Property Facts** - Key features, layout highlights, unique selling points
2. **Neighborhood Highlights** - Schools, amenities, commute, lifestyle
3. **Market Context** - Recent comps, price trends, days on market
4. **Talking Points** - 5-7 compelling points to emphasize during showing
5. **Objection Handling** - Common objections and how to address them
6. **FAQs** - Questions clients typically ask about this type of property

Be specific, data-driven, and actionable.`;

    try {
      const result = await callOllamaChat([
        { role: 'system', content: 'You are a professional real estate showing assistant. Provide detailed, actionable briefings.' },
        { role: 'user', content: prompt },
      ]);
      setBriefing(result);
    } catch (e) {
      setError(`Failed to generate briefing: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const handleGenerateFollowUp = async () => {
    if (!selectedShowing) return;
    setLoading(true);
    setFollowUp('');

    const prompt = `Generate a professional post-showing follow-up email for:
Client: ${selectedShowing.lead ? `${selectedShowing.lead.firstName} ${selectedShowing.lead.lastName}` : 'the client'}
Property: ${selectedShowing.property?.address || 'the property shown'}

Include:
- Thank you message
- Summary of key features discussed
- Next steps options
- Personalized touch based on their interests
- Call to action

Keep it warm, professional, and under 200 words.`;

    try {
      const result = await callOllamaChat([
        { role: 'system', content: 'You write excellent real estate follow-up emails.' },
        { role: 'user', content: prompt },
      ]);
      setFollowUp(result);
    } catch (e) {
      setError(`Failed to generate follow-up: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="text-orange-500" /> AI Showing Assistant</h1>
        <p className="text-gray-500 mt-1">Generate comprehensive showings briefings and follow-ups</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <label className="block text-sm font-medium mb-2">Select a Showing</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
          <option value="">— Choose a showing —</option>
          {showings.map(s => (
            <option key={s.id} value={s.id}>
              {new Date(s.scheduledAt).toLocaleString()} — {s.property?.address || 'Property'} ({s.status.replace('_', ' ')})
            </option>
          ))}
        </select>

        {selectedShowing && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Showing Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><MapPin size={14} className="inline" /> {selectedShowing.property?.address || 'N/A'}</p>
              <p><Home size={14} className="inline" /> {selectedShowing.property ? `${selectedShowing.property.bedrooms}bd/${selectedShowing.property.bathrooms}ba` : 'N/A'}</p>
              <p><Users size={14} className="inline" /> {selectedShowing.lead ? `${selectedShowing.lead.firstName} ${selectedShowing.lead.lastName}` : 'Walk-in'}</p>
              <p><TrendingUp size={14} className="inline" /> {selectedShowing.property ? `$${selectedShowing.property.price.toLocaleString()}` : 'N/A'}</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button onClick={handleGenerateBriefing} disabled={loading || !selectedId} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Generate Briefing
          </button>
          <button onClick={handleGenerateFollowUp} disabled={loading || !selectedId} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Generate Follow-Up
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}

      {briefing && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-orange-50"><h2 className="font-semibold flex items-center gap-2"><MessageSquare size={18} /> Showing Briefing</h2></div>
          <div className="p-6 prose prose-sm max-w-none">
            {briefing.split('\n').map((line, i) => {
              if (line.startsWith('###### ')) return <h6 key={i} className="text-sm font-semibold mt-3 mb-1">{line.replace('###### ', '')}</h6>;
              if (line.startsWith('#### ')) return <h4 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('#### ', '')}</h4>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-4 mb-2 text-gray-900">{line.replace(/^### \d+\.\s*/, '')}</h3>;
              if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 text-sm">{line.replace(/^[-*]\s*/, '')}</li>;
              if (line.trim() === '') return <div key={i} className="h-2" />;
              return <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>;
            })}
          </div>
        </div>
      )}

      {followUp && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-blue-50"><h2 className="font-semibold flex items-center gap-2"><Send size={18} /> Follow-Up Email</h2></div>
          <div className="p-6 prose prose-sm max-w-none">
            {followUp.split('\n').map((line, i) => (
              line.trim() === '' ? <div key={i} className="h-2" /> : <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
