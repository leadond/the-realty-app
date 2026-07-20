'use client';
import { useEffect, useState } from 'react';
import { BarChart3, Loader2, Copy, Check, FileText, Users, Calendar, Briefcase } from 'lucide-react';
import { callAIChat } from '@/lib/ai/provider';

type Lead = { status: string; priority: string; source: string; budgetMax?: number | null };
type Showing = { status: string; scheduledAt: string };

const REPORT_TYPES = [
  { id: 'SALES_PERFORMANCE', name: 'Sales Performance', icon: Briefcase },
  { id: 'LEAD_ANALYSIS', name: 'Lead Analysis', icon: Users },
  { id: 'MARKET_TRENDS', name: 'Market Trends', icon: BarChart3 },
  { id: 'CLIENT_ACTIVITY', name: 'Client Activity', icon: Calendar },
];

export default function ReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showings, setShowings] = useState<Showing[]>([]);
  const [reportType, setReportType] = useState('LEAD_ANALYSIS');
  const [range, setRange] = useState('last-30-days');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(d => { if (d.ok) setLeads(d.leads); }).catch(() => {});
    fetch('/api/showings').then(r => r.json()).then(d => { if (d.ok) setShowings(d.showings); }).catch(() => {});
  }, []);

  const stats = {
    totalLeads: leads.length,
    qualifiedLeads: leads.filter(l => ['QUALIFIED', 'ACTIVE', 'NEGOTIATING', 'WON'].includes(l.status)).length,
    wonLeads: leads.filter(l => l.status === 'WON').length,
    pipelineValue: leads.reduce((sum, l) => sum + (l.budgetMax || 0), 0),
    totalShowings: showings.length,
    completedShowings: showings.filter(s => s.status === 'COMPLETED').length,
  };

  const bySource = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {});

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setReport('');
    setCopied(false);

    const typeName = REPORT_TYPES.find(t => t.id === reportType)?.name || reportType;
    const prompt = `You are a real estate business analyst. Generate a "${typeName}" report for the period "${range}" using this real workspace data:

- Total leads: ${stats.totalLeads}
- Qualified leads: ${stats.qualifiedLeads}
- Closed/won deals: ${stats.wonLeads}
- Total pipeline value (sum of buyer budgets): $${stats.pipelineValue.toLocaleString()}
- Total showings: ${stats.totalShowings}
- Completed showings: ${stats.completedShowings}
- Leads by source: ${Object.entries(bySource).map(([s, n]) => `${s.replace('_', ' ')}: ${n}`).join(', ') || 'none'}

Provide:
1. **Executive Summary** — 2-3 sentence overview
2. **Key Metrics** — conversion rate, showing completion rate, average pipeline value per lead
3. **Insights** — what the numbers reveal about performance
4. **Best Lead Sources** — which sources are performing and why
5. **Recommendations** — 3-5 specific, actionable next steps

Format in clear markdown with headers. Be concise and practical.`;

    try {
      const response = await callAIChat([
        { role: 'system', content: 'You are a sharp real estate business analyst. Produce concise, actionable reports from the data provided.' },
        { role: 'user', content: prompt },
      ]);
      setReport(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Report generation failed');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const conversionRate = stats.totalLeads ? Math.round((stats.wonLeads / stats.totalLeads) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="text-blue-500" /> Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">AI-generated reports from your live pipeline data</p>
      </div>

      {/* Live stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="text-2xl font-bold">{stats.totalLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-2xl font-bold text-green-600">{conversionRate}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Pipeline Value</p>
          <p className="text-2xl font-bold">${Math.round(stats.pipelineValue / 1000)}k</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Showings</p>
          <p className="text-2xl font-bold">{stats.completedShowings}/{stats.totalShowings}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {REPORT_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setReportType(t.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${reportType === t.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'}`}
              >
                <Icon size={22} className={reportType === t.id ? 'text-blue-600' : 'text-gray-500'} />
                <span className="text-sm font-medium text-center">{t.name}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={range} onChange={e => setRange(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="last-7-days">Last 7 days</option>
            <option value="last-30-days">Last 30 days</option>
            <option value="this-quarter">This quarter</option>
            <option value="this-year">This year</option>
          </select>
          <button onClick={handleGenerate} disabled={loading} className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>}

      {report && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-blue-50 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><BarChart3 size={18} className="text-blue-600" /> {REPORT_TYPES.find(t => t.id === reportType)?.name} Report</h2>
            <button onClick={handleCopy} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-6 prose prose-sm max-w-none">
            {report.split('\n').map((line, i) => {
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
    </div>
  );
}
