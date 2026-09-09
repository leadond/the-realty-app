'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Database,
  DollarSign,
  FileSearch,
  Gauge,
  Loader2,
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

type BridgeRecord = Record<string, unknown>;

function resultPreview(data: unknown) {
  if (!data) return 'No response yet.';
  return JSON.stringify(data, null, 2).slice(0, 12000);
}

async function fetchJson(path: string) {
  const response = await fetch(path, { cache: 'no-store' });
  return response.json() as Promise<BridgeResult>;
}

function bridgeItems(data: unknown): BridgeRecord[] {
  if (Array.isArray(data)) return data.filter((item): item is BridgeRecord => Boolean(item && typeof item === 'object'));
  if (!data || typeof data !== 'object') return [];
  const record = data as BridgeRecord;
  for (const key of ['value', 'bundle', 'items', 'data', 'results']) {
    if (Array.isArray(record[key])) {
      return record[key].filter((item): item is BridgeRecord => Boolean(item && typeof item === 'object'));
    }
  }
  return [];
}

function stringField(record: BridgeRecord, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return fallback;
}

function numberField(record: BridgeRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key];
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

function mapPropertyType(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('condo')) return 'CONDO';
  if (normalized.includes('town')) return 'TOWNHOUSE';
  if (normalized.includes('multi')) return 'MULTI_FAMILY';
  if (normalized.includes('land') || normalized.includes('lot')) return 'LAND';
  if (normalized.includes('mobile') || normalized.includes('manufactured')) return 'MOBILE_HOME';
  if (normalized.includes('commercial')) return 'COMMERCIAL';
  if (normalized.includes('ranch') || normalized.includes('farm')) return 'RANCH';
  return 'SINGLE_FAMILY';
}

function mapStatus(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('pending')) return 'PENDING';
  if (normalized.includes('sold') || normalized.includes('closed')) return 'SOLD';
  if (normalized.includes('off')) return 'OFF_MARKET';
  if (normalized.includes('coming')) return 'COMING_SOON';
  return 'ACTIVE';
}

function mediaUrls(record: BridgeRecord) {
  const media = record.Media;
  if (!Array.isArray(media)) return null;
  const urls = media
    .map((item) => (item && typeof item === 'object' ? stringField(item as BridgeRecord, ['MediaURL', 'MediaUrl', 'url']) : ''))
    .filter(Boolean)
    .slice(0, 12);
  return urls.length ? JSON.stringify(urls) : null;
}

function propertyPayload(record: BridgeRecord) {
  const propertyType = stringField(record, ['PropertyType', 'PropertySubType']);
  const status = stringField(record, ['StandardStatus', 'MlsStatus'], 'Active');
  const featureValues = [
    stringField(record, ['InteriorFeatures']),
    stringField(record, ['ExteriorFeatures']),
    stringField(record, ['CommunityFeatures']),
  ].filter(Boolean);

  return {
    mlsId: stringField(record, ['ListingId', 'ListingKey', 'MlsNumber']) || undefined,
    address: stringField(record, ['UnparsedAddress', 'StreetName', 'Address']),
    city: stringField(record, ['City']),
    state: stringField(record, ['StateOrProvince', 'State']),
    zip: stringField(record, ['PostalCode', 'Zip']),
    price: numberField(record, ['ListPrice', 'ClosePrice']),
    bedrooms: numberField(record, ['BedroomsTotal', 'Bedrooms']),
    bathrooms: numberField(record, ['BathroomsTotalInteger', 'BathroomsFull', 'BathroomsTotal']),
    sqft: numberField(record, ['LivingArea', 'BuildingAreaTotal', 'AboveGradeFinishedArea']) || undefined,
    lotSize: numberField(record, ['LotSizeAcres']) || undefined,
    yearBuilt: numberField(record, ['YearBuilt']) || undefined,
    propertyType: mapPropertyType(propertyType),
    status: mapStatus(status),
    description: stringField(record, ['PublicRemarks', 'PrivateRemarks']),
    features: featureValues.length ? JSON.stringify(featureValues) : undefined,
    photos: mediaUrls(record) || undefined,
  };
}

export default function ZillowBridgePage() {
  const [activeTab, setActiveTab] = useState<LookupTab>('properties');
  const [loading, setLoading] = useState(false);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [datasets, setDatasets] = useState<BridgeResult | null>(null);
  const [result, setResult] = useState<BridgeResult | null>(null);
  const [savingListingId, setSavingListingId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

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
    setSaveMessage('');

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

  const saveListing = async (record: BridgeRecord) => {
    const payload = propertyPayload(record);
    const listingKey = payload.mlsId || payload.address || 'listing';
    if (!payload.address || !payload.city || !payload.state || !payload.zip || !payload.price) {
      setSaveMessage('This Bridge record is missing address, city, state, zip, or price, so it cannot be saved yet.');
      return;
    }

    setSavingListingId(listingKey);
    setSaveMessage('');
    const response = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data?.ok) {
      setSaveMessage(`Saved ${payload.address} to Properties.`);
    } else {
      setSaveMessage(data?.error || 'Could not save this listing.');
    }
    setSavingListingId(null);
  };

  const ActiveIcon = lookupTabs.find((tab) => tab.id === activeTab)?.icon || Search;
  const listingResults = activeTab === 'properties' ? bridgeItems(result?.data) : [];

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
            {saveMessage && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{saveMessage}</div>}
            {listingResults.length > 0 && (
              <div className="mb-4 grid gap-3 lg:grid-cols-2">
                {listingResults.slice(0, 10).map((record, index) => {
                  const payload = propertyPayload(record);
                  const listingKey = payload.mlsId || `${payload.address}-${index}`;
                  return (
                    <article key={listingKey} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{payload.address || 'Unnamed listing'}</h3>
                          <p className="mt-1 text-xs text-gray-500">
                            {[payload.city, payload.state, payload.zip].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          {payload.status}
                        </span>
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <dt className="text-gray-400">Price</dt>
                          <dd className="font-semibold text-gray-800">{payload.price ? `$${payload.price.toLocaleString()}` : '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">Beds</dt>
                          <dd className="font-semibold text-gray-800">{payload.bedrooms || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">Baths</dt>
                          <dd className="font-semibold text-gray-800">{payload.bathrooms || '-'}</dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        onClick={() => saveListing(record)}
                        disabled={savingListingId === listingKey}
                        className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {savingListingId === listingKey ? 'Saving...' : 'Save to Properties'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
            <pre className="max-h-[34rem] overflow-auto rounded-lg bg-gray-950 p-4 text-xs leading-5 text-gray-100">
              {resultPreview(result?.data || result)}
            </pre>
          </div>
        </main>
      </div>
    </div>
  );
}
