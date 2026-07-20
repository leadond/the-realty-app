'use client';
import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2, Share2, Mail, FileText, MessageCircle, Palette } from 'lucide-react';
import { callAIChat } from '@/lib/ai/provider';

export default function MarketingPage() {
  const [propertyDetails, setPropertyDetails] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'instagram' | 'zillow' | 'email'>('facebook');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const platforms = [
    { id: 'facebook' as const, name: 'Facebook Post', icon: Share2, color: 'bg-blue-600' },
    { id: 'instagram' as const, name: 'Instagram Caption', icon: MessageCircle, color: 'bg-pink-600' },
    { id: 'zillow' as const, name: 'Zillow Ad Copy', icon: FileText, color: 'bg-blue-500' },
    { id: 'email' as const, name: 'Email Blast', icon: Mail, color: 'bg-green-600' },
  ];

  const generateContent = async (platform: string) => {
    if (!propertyDetails.trim()) return;
    setLoading(true);
    setResults(prev => ({ ...prev, [platform]: '' }));

    const prompts: Record<string, string> = {
      facebook: `Write an engaging Facebook post for this real estate listing. Include emojis, a compelling hook, key features as bullet points, and a call-to-action. Keep it under 280 characters for the main text. Property details: ${propertyDetails}`,
      instagram: `Write an Instagram caption for this real estate listing. Include relevant hashtags (10-15), engaging text with line breaks, emojis, and a strong CTA. Property details: ${propertyDetails}`,
      zillow: `Write compelling ad copy for a Zillow/Realtor.com listing. Professional tone, highlight unique features, include neighborhood appeal, and create urgency. 150-250 words. Property details: ${propertyDetails}`,
      email: `Write an email blast announcing this new listing. Include a subject line, engaging opening, property highlights, neighborhood info, and a clear call-to-action to schedule a showing. Professional but warm tone. Property details: ${propertyDetails}`,
    };

    try {
      const result = await callAIChat([
        { role: 'system', content: 'You are an expert real estate marketing copywriter.' },
        { role: 'user', content: prompts[platform] || prompts.facebook },
      ]);
      setResults(prev => ({ ...prev, [platform]: result }));
    } catch (e) {
      setResults(prev => ({ ...prev, [platform]: `Failed: ${e instanceof Error ? e.message : 'Unknown error'}` }));
    }
    setLoading(false);
  };

  const generateFlyer = async () => {
    if (!propertyDetails.trim()) return;
    setLoading(true);
    setResults(prev => ({ ...prev, flyer: '' }));

    try {
      const result = await callAIChat([
        { role: 'system', content: 'You design real estate flyers. Write compelling flyer content with clear sections.' },
        { role: 'user', content: `Write content for a real estate open house/listing flyer. Include:\n1. Eye-catching headline\n2. Property highlights (3-5 bullet points)\n3. Neighborhood selling points\n4. Agent contact section\n5. QR code call-to-action text\n\nProperty details: ${propertyDetails}` },
      ]);
      setResults(prev => ({ ...prev, flyer: result }));
    } catch (e) {
      setResults(prev => ({ ...prev, flyer: `Failed: ${e instanceof Error ? e.message : 'Unknown error'}` }));
    }
    setLoading(false);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Palette className="text-pink-500" /> Marketing & Social Media</h1>
        <p className="text-gray-500 mt-1">AI-generated marketing content for listings</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <label className="block text-sm font-medium mb-2">Property Details</label>
        <textarea
          value={propertyDetails}
          onChange={e => setPropertyDetails(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          rows={5}
          placeholder="123 Main St, Austin TX - 3 bed/2 bath, 2000 sqft, modern kitchen, pool, great schools..."
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {platforms.map(p => (
          <button
            key={p.id}
            onClick={() => generateContent(p.id)}
            disabled={loading || !propertyDetails.trim()}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${selectedPlatform === p.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'} bg-white disabled:opacity-50`}
          >
            <p.icon size={24} className={p.color.replace('bg-', 'text-')} />
            <span className="text-sm font-medium">{p.name}</span>
            {results[p.id] && <span className="text-xs text-green-600">✓ Generated</span>}
          </button>
        ))}
        <button
          onClick={generateFlyer}
          disabled={loading || !propertyDetails.trim()}
          className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-gray-400 bg-white disabled:opacity-50"
        >
          <FileText size={24} className="text-purple-600" />
          <span className="text-sm font-medium">Flyer Content</span>
          {results.flyer && <span className="text-xs text-green-600">✓ Generated</span>}
        </button>
      </div>

      {Object.entries(results).map(([key, content]) => content && (
        <div key={key} className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold capitalize">{key === 'flyer' ? 'Flyer Content' : `${key} Content`}</h3>
            <button onClick={() => handleCopy(content, key)} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-200 rounded-lg hover:bg-gray-300">
              {copied === key ? <Check size={14} /> : <Copy size={14} />}
              {copied === key ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-6 prose prose-sm max-w-none">
            {content.split('\n').map((line, i) => (
              line.trim() === '' ? <div key={i} className="h-2" /> : <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      ))}

      {!Object.values(results).some(Boolean) && (
        <div className="text-center py-16">
          <Sparkles size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Enter property details and click a platform to generate marketing content</p>
        </div>
      )}
    </div>
  );
}
