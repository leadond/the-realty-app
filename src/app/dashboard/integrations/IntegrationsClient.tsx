'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plug, Upload, CheckCircle, X, ArrowRight, FileWarning } from 'lucide-react';

type Integration = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  requiresCredentials: boolean;
  isConfigured: boolean;
  isConnected: boolean;
};

const LEAD_FIELDS = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'priority', label: 'Priority', required: false },
  { key: 'budgetMin', label: 'Budget Min', required: false },
  { key: 'budgetMax', label: 'Budget Max', required: false },
  { key: 'location', label: 'Location', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

function parseCSVClient(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const parseLine = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else current += char;
    }
    result.push(current.trim());
    return result;
  };
  if (lines.length === 0) return { headers: [], rows: [] };
  return { headers: parseLine(lines[0]), rows: lines.slice(1).map(parseLine) };
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [slackError, setSlackError] = useState('');

  const [csvContent, setCsvContent] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvRowCount, setCsvRowCount] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dedupe, setDedupe] = useState<'skip' | 'update'>('skip');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errored: number } | null>(null);
  const [step, setStep] = useState<'upload' | 'map' | 'result'>('upload');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations');
      const data = await res.json();
      if (data.ok) setIntegrations(data.integrations);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { headers, rows } = parseCSVClient(text);
    setCsvContent(text);
    setCsvHeaders(headers);
    setCsvPreview(rows.slice(0, 3));
    setCsvRowCount(rows.length);

    const autoMap: Record<string, string> = {};
    for (const field of LEAD_FIELDS) {
      const match = headers.find(h => h.toLowerCase().replace(/[^a-z]/g, '') === field.key.toLowerCase());
      if (match) autoMap[field.key] = match;
    }
    setMapping(autoMap);
    setStep('map');
  };

  const handleImport = async () => {
    setImporting(true);
    const res = await fetch('/api/import/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent, mapping, dedupe }),
    });
    const data = await res.json();
    setImporting(false);
    if (data.ok) {
      setImportResult({ imported: data.imported, skipped: data.skipped, errored: data.errored });
      setStep('result');
    } else {
      alert(data.error || 'Import failed');
    }
  };

  const resetImport = () => {
    setCsvContent(''); setCsvHeaders([]); setCsvPreview([]); setMapping({}); setImportResult(null); setStep('upload');
  };

  const handleSlackConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlackError('');
    const res = await fetch('/api/integrations/slack/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl }),
    });
    const data = await res.json();
    if (!data.ok) {
      setSlackError(data.error || 'Failed to connect');
      return;
    }
    setShowSlackModal(false);
    setWebhookUrl('');
    load();
  };

  const handleDisconnect = async (name: string) => {
    await fetch(`/api/integrations/${name}/disconnect`, { method: 'POST' });
    load();
  };

  if (loading) return <div className="p-6">Loading integrations...</div>;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Plug className="text-emerald-600" /> Connected Apps</h1>
        <p className="text-gray-500 mt-1">Import your data and connect the tools you already use</p>
      </div>

      {/* CSV Import Wizard */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="p-4 border-b bg-emerald-50">
          <h2 className="font-semibold flex items-center gap-2"><Upload size={18} className="text-emerald-600" /> Import Leads from CSV</h2>
          <p className="text-sm text-gray-500 mt-1">Works with any CRM export — map your columns to ours, no fixed format required</p>
        </div>

        <div className="p-6">
          {step === 'upload' && (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-10 cursor-pointer hover:border-emerald-400">
              <Upload size={28} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Click to choose a CSV file</span>
              <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
            </label>
          )}

          {step === 'map' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Found {csvRowCount} row(s). Map your columns below (we auto-matched what we could):</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LEAD_FIELDS.map(field => (
                  <div key={field.key} className="flex items-center gap-2">
                    <span className="w-28 text-sm font-medium shrink-0">{field.label}{field.required && <span className="text-red-500">*</span>}</span>
                    <ArrowRight size={14} className="text-gray-300 shrink-0" />
                    <select
                      value={mapping[field.key] || ''}
                      onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="flex-1 px-2 py-1.5 border rounded-lg text-sm"
                    >
                      <option value="">— Skip —</option>
                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {csvPreview.length > 0 && (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50">{csvHeaders.map(h => <th key={h} className="text-left px-2 py-1 font-medium">{h}</th>)}</tr></thead>
                    <tbody>{csvPreview.map((row, i) => <tr key={i} className="border-t">{row.map((c, j) => <td key={j} className="px-2 py-1 text-gray-500 truncate max-w-[120px]">{c}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">If a match already exists:</label>
                <select value={dedupe} onChange={e => setDedupe(e.target.value as 'skip' | 'update')} className="px-2 py-1.5 border rounded-lg text-sm">
                  <option value="skip">Skip it</option>
                  <option value="update">Update it with new data</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button onClick={handleImport} disabled={importing || (!mapping.firstName && !mapping.lastName)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  {importing ? 'Importing...' : `Import ${csvRowCount} Row(s)`}
                </button>
                <button onClick={resetImport} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="text-center py-6">
              <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
              <p className="text-lg font-semibold">Import complete</p>
              <p className="text-gray-500 mt-1">{importResult.imported} imported · {importResult.skipped} skipped · {importResult.errored} errored</p>
              {importResult.errored > 0 && (
                <p className="text-sm text-amber-600 mt-2 flex items-center justify-center gap-1"><FileWarning size={14} /> Some rows had errors and were skipped</p>
              )}
              <button onClick={resetImport} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Import Another File</button>
            </div>
          )}
        </div>
      </div>

      {/* Integrations Grid */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.filter(i => i.name !== 'csv').map(integration => (
            <div key={integration.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{integration.displayName}</h3>
                {integration.isConnected && <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Connected</span>}
              </div>
              <p className="text-sm text-gray-500 mb-3">{integration.description}</p>
              {integration.name === 'slack' ? (
                integration.isConnected ? (
                  <button onClick={() => handleDisconnect('slack')} className="text-sm text-red-600 hover:text-red-700">Disconnect</button>
                ) : (
                  <button onClick={() => setShowSlackModal(true)} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Connect</button>
                )
              ) : integration.name === 'zillow' ? (
                <Link href="/dashboard/zillow-bridge" className="inline-flex px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  Open Bridge
                </Link>
              ) : integration.isConfigured ? (
                <button className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Connect</button>
              ) : (
                <span className="text-xs text-gray-400">Requires developer app setup — see docs</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {showSlackModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowSlackModal(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Connect Slack</h2>
              <button onClick={() => setShowSlackModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Create an <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Incoming Webhook</a> in your Slack workspace and paste the URL below.
            </p>
            <form onSubmit={handleSlackConnect} className="space-y-3">
              <input type="url" required value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://hooks.slack.com/services/..." />
              {slackError && <p className="text-red-500 text-sm">{slackError}</p>}
              <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Connect</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
