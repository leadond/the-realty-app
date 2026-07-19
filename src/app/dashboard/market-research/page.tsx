'use client';
import { useState } from 'react';
import { Search, Loader2, TrendingUp, School, MapPin, DollarSign, Users, Home, Sparkles } from 'lucide-react';
import { callOllamaChat } from '@/lib/ai/provider';

export default function MarketResearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState('');

  const handleResearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult('');

    const prompt = `You are a real estate market research analyst. Provide a comprehensive market analysis for: ${query}

Include the following sections with realistic data:

1. **Market Overview** - Current market conditions, buyer/seller market status
2. **Comparable Properties** - 3-5 recent comps with addresses, prices, beds/baths, sqft, price/sqft, days on market
3. **Price Trends** - 6-month and 1-year price trends, appreciation rates
4. **Demographics** - Population, median income, age distribution, education levels
5. **School Ratings** - Nearby schools with ratings (elementary, middle, high)
6. **Neighborhood Amenities** - Parks, shopping, dining, transit, healthcare
7. **Investment Potential** - Rental yield estimates, cap rates, appreciation outlook
8. **Risk Factors** - Any concerns like flood zones, crime trends, market saturation

Format the response in clear markdown with headers and bullet points. Be specific and data-driven.`;

    try {
      const response = await callOllamaChat([
        { role: 'system', content: 'You are an expert real estate market analyst. Provide detailed, data-rich market research reports.' },
        { role: 'user', content: prompt },
      ]);
      setResult(response);
    } catch (e) {
      setError(`Research failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="text-blue-500" /> Market Research
        </h1>
        <p className="text-gray-500 mt-1">AI-powered market analysis for any address or neighborhood</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleResearch()}
              placeholder="Enter an address, neighborhood, or city..."
              className="w-full pl-10 pr-3 py-2.5 border rounded-lg"
            />
          </div>
          <button
            onClick={handleResearch}
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {loading ? 'Researching...' : 'Research'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      {result && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            <h2 className="font-semibold">Market Research Report</h2>
            <span className="text-sm text-gray-500 ml-auto">
              for <span className="font-medium">{query}</span>
            </span>
          </div>
          <div className="p-6 prose prose-sm max-w-none">
            {/* Render markdown-like content */}
            {result.split('\n').map((line, i) => {
              if (line.startsWith('###### ')) return <h6 key={i} className="text-sm font-semibold mt-4 mb-2">{line.replace('###### ', '')}</h6>;
              if (line.startsWith('##### ')) return <h5 key={i} className="text-base font-semibold mt-4 mb-2">{line.replace('##### ', '')}</h5>;
              if (line.startsWith('#### ')) return <h4 key={i} className="text-lg font-bold mt-5 mb-2 text-gray-800">{line.replace('#### ', '')}</h4>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-5 mb-3 text-gray-900 flex items-center gap-2">
                {line.startsWith('### 1') && <DollarSign size={18} className="text-green-600" />}
                {line.startsWith('### 2') && <Home size={18} className="text-blue-600" />}
                {line.startsWith('### 3') && <TrendingUp size={18} className="text-purple-600" />}
                {line.startsWith('### 4') && <Users size={18} className="text-orange-600" />}
                {line.startsWith('### 5') && <School size={18} className="text-yellow-600" />}
                {line.startsWith('### 6') && <MapPin size={18} className="text-teal-600" />}
                {line.replace(/^### \d+\.\s*/, '')}
              </h3>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-5 mb-3">{line.replace('## ', '')}</h2>;
              if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-5 mb-3">{line.replace('# ', '')}</h1>;
              if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 text-sm text-gray-700">{line.replace(/^[-*]\s*/, '')}</li>;
              if (line.trim() === '') return <div key={i} className="h-2" />;
              return <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>;
            })}
          </div>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Enter an address or neighborhood to start research</p>
        </div>
      )}
    </div>
  );
}
