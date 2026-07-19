'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Database,
  DollarSign,
  FileSearch,
  Gauge,
  Loader2,
  MapPinned,
  RefreshCcw,
  Search,
} from 'lucide-react';

type BridgeResult = {
  ok?: boolean;
  configured?: boolean;
  count?: number;
  data?: unknown;
  error?: string;
};

const lookupTabs = [
  { id: 'properties', label: 'Properties', icon: Building2 },
  { id: 'zestimates', label: 'Zestimates', icon: DollarSign },
  { id: 'records', label: 'Public Records', icon: FileSearch },
  { id: 'econ', label: 'Econ Data', icon: Gauge },
] as const;

type LookupTab = (typeof lookupTabs)[number]['id'];

function resultPreview(data: unknown) {
  if (!data) return 'No response yet.';
  return JSON.stringify(data, null, 2).slice(0, 12000);
}

async function fetchJson(path: string) {
  const response = await fetch(path, { cache: 'no-store' });
  return response.json() as Promise<BridgeResult>;
}

export default function ZillowBridgePage() {
  const [activeTab, setActiveTab] = useState<LookupTab>('properties');
  const [loading, setLoading] = useState(false);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [datasets, setDatasets] = useState<BridgeResult | null>(null);
  const [result, setResult] = useState<BridgeResult | null>(null);

  const [propertyForm, setPropertyForm] = useState({
    datasetId: '',
    listingId: '',
    postalCode: '',
    address: '',
    city: '',
    status: 'Active',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
  });
  const [zestimateForm, setZestimateForm] = useState({ address: '', zpid: '' });
  const [recordsForm, setRecordsForm] = useState({ address: '', zpid: '', parcelId: '' });
  const [econForm, setEconForm] = useState({ report: 'region', stateCodeFIPS: '48', regionId: '', regionType: '' });

  const datasetItems = useMemo(() => {
    const data = datasets?.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      for (const key of ['value', 'bundle', 'items', 'data', 'results']) {
        if (Array.isArray(record[key])) return record[key] as unknown[];
      }
    }
    return [];
  }, [datasets]);

  const loadDatasets = async () => {
    setDatasetsLoading(true);
    const data = await fetchJson('/api/bridge/datasets').catch((error) => ({
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load datasets',
    }));
    setDatasets(data);
    setDatasetsLoading(false);
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const runLookup = async () => {
    setLoading(true);
    setResult(null);

    const params = new URLSearchParams();
    let path = '/api/bridge/properties';

    if (activeTab === 'properties') {
      path = '/api/bridge/properties';
      Object.entries(propertyForm).forEach(([key, value]) => value && params.set(key, value));
      params.set('limit', '10');
    }

    if (activeTab === 'zestimates') {
      path = '/api/bridge/zestimates';
      Object.entries(zestimateForm).forEach(([key, value]) => value && params.set(key, value));
    }

    if (activeTab === 'records') {
      path = '/api/bridge/public-records';
      Object.entries(recordsForm).forEach(([key, value]) => value && params.set(key, value));
    }

    if (activeTab === 'econ') {
      path = '/api/bridge/econ';
      Object.entries(econForm).forEach(([key, value]) => value && params.set(key, value));
    }

    const query = params.toString();
    const data = await fetchJson(`${path}${query ? `?${query}` : ''}`).catch((error) => ({
      ok: false,
      error: error instanceof Error ? error.message : 'Bridge lookup failed',
    }));

    setResult(data);
    setLoading(false);
  };

  const ActiveIcon = lookupTabs.find((tab) => tab.id === activeTab)?.icon || Search;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Database className="text-emerald-600" /> Zillow / Bridge Data
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Query Bridge Data Output from server-side app routes. Tokens stay out of browser code.
          </p>
        </div>
        <button
          onClick={loadDatasets}
          disabled={datasetsLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {datasetsLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
          Refresh datasets
        </button>
      </div>

      {datasets?.error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {datasets.error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Bridge APIs</h2>
            <div className="space-y-1">
              {lookupTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setResult(null);
                    }}
                    className={`flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-medium ${
                      activeTab === tab.id ? 'bg-emerald-50 text-emerald-800' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Datasets</h2>
              <span className="text-xs text-gray-400">{datasetItems.length || 0}</span>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto text-xs text-gray-500">
              {datasetsLoading && <p>Loading datasets...</p>}
              {!datasetsLoading && datasetItems.length === 0 && <p>No datasets loaded.</p>}
              {datasetItems.slice(0, 25).map((item, index) => {
                const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
                const id = String(record.id || record.code || record.datasetId || record.name || index);
                const label = String(record.name || record.displayName || record.code || id);
                return (
                  <button
                    key={`${id}-${index}`}
                    onClick={() => setPropertyForm((prev) => ({ ...prev, datasetId: id }))}
                    className="block w-full rounded-md border px-3 py-2 text-left hover:border-emerald-400"
                  >
                    <span className="block font-medium text-gray-700">{label}</span>
                    <span className="block truncate">{id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="space-y-4">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <ActiveIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold">{lookupTabs.find((tab) => tab.id === activeTab)?.label}</h2>
            </div>

            {activeTab === 'properties' && (
              <div className="grid gap-4 md:grid-cols-2">
                <input value={propertyForm.datasetId} onChange={(e) => setPropertyForm((p) => ({ ...p, datasetId: e.target.value }))} placeholder="Dataset ID or code" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={propertyForm.listingId} onChange={(e) => setPropertyForm((p) => ({ ...p, listingId: e.target.value }))} placeholder="Listing ID" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={propertyForm.address} onChange={(e) => setPropertyForm((p) => ({ ...p, address: e.target.value }))} placeholder="Address contains" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={propertyForm.postalCode} onChange={(e) => setPropertyForm((p) => ({ ...p, postalCode: e.target.value }))} placeholder="Postal code" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={propertyForm.city} onChange={(e) => setPropertyForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={propertyForm.status} onChange={(e) => setPropertyForm((p) => ({ ...p, status: e.target.value }))} placeholder="Standard status" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={propertyForm.propertyType} onChange={(e) => setPropertyForm((p) => ({ ...p, propertyType: e.target.value }))} placeholder="Property type" className="rounded-lg border px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={propertyForm.minPrice} onChange={(e) => setPropertyForm((p) => ({ ...p, minPrice: e.target.value }))} placeholder="Min price" className="rounded-lg border px-3 py-2 text-sm" />
                  <input value={propertyForm.maxPrice} onChange={(e) => setPropertyForm((p) => ({ ...p, maxPrice: e.target.value }))} placeholder="Max price" className="rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
            )}

            {activeTab === 'zestimates' && (
              <div className="grid gap-4 md:grid-cols-2">
                <input value={zestimateForm.address} onChange={(e) => setZestimateForm((p) => ({ ...p, address: e.target.value }))} placeholder="Full address" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={zestimateForm.zpid} onChange={(e) => setZestimateForm((p) => ({ ...p, zpid: e.target.value }))} placeholder="Zillow zpid" className="rounded-lg border px-3 py-2 text-sm" />
              </div>
            )}

            {activeTab === 'records' && (
              <div className="grid gap-4 md:grid-cols-3">
                <input value={recordsForm.address} onChange={(e) => setRecordsForm((p) => ({ ...p, address: e.target.value }))} placeholder="Full address" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={recordsForm.zpid} onChange={(e) => setRecordsForm((p) => ({ ...p, zpid: e.target.value }))} placeholder="Zillow zpid" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={recordsForm.parcelId} onChange={(e) => setRecordsForm((p) => ({ ...p, parcelId: e.target.value }))} placeholder="Parcel ID for transactions" className="rounded-lg border px-3 py-2 text-sm" />
              </div>
            )}

            {activeTab === 'econ' && (
              <div className="grid gap-4 md:grid-cols-4">
                <select value={econForm.report} onChange={(e) => setEconForm((p) => ({ ...p, report: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm">
                  <option value="region">Region</option>
                  <option value="marketreport">Market report</option>
                </select>
                <input value={econForm.stateCodeFIPS} onChange={(e) => setEconForm((p) => ({ ...p, stateCodeFIPS: e.target.value }))} placeholder="State FIPS" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={econForm.regionId} onChange={(e) => setEconForm((p) => ({ ...p, regionId: e.target.value }))} placeholder="Region ID" className="rounded-lg border px-3 py-2 text-sm" />
                <input value={econForm.regionType} onChange={(e) => setEconForm((p) => ({ ...p, regionType: e.target.value }))} placeholder="Region type" className="rounded-lg border px-3 py-2 text-sm" />
              </div>
            )}

            <button
              onClick={runLookup}
              disabled={loading}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Run lookup
            </button>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Bridge Response</h2>
                <p className="text-xs text-gray-400">Displayed dynamically. Do not store Zillow data unless your agreement allows it.</p>
              </div>
              {typeof result?.count === 'number' && <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{result.count} item(s)</span>}
            </div>
            {result?.error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{result.error}</div>}
            <pre className="max-h-[34rem] overflow-auto rounded-lg bg-gray-950 p-4 text-xs leading-5 text-gray-100">
              {resultPreview(result?.data || result)}
            </pre>
          </div>
        </main>
      </div>
    </div>
  );
}
