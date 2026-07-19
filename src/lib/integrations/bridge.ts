const DEFAULT_BRIDGE_BASE_URL = "https://api.bridgedataoutput.com";

export type BridgeQueryValue = string | number | boolean | null | undefined;

export type BridgeRequestOptions = {
  params?: Record<string, BridgeQueryValue>;
};

export type BridgeDataset = {
  id?: string;
  name?: string;
  code?: string;
  displayName?: string;
  description?: string;
  [key: string]: unknown;
};

export type BridgeResponse<T = unknown> = {
  data: T;
  url: string;
};

function getBridgeServerToken() {
  return (
    process.env.BRIDGE_SERVER_TOKEN ||
    process.env.BRIDGE_ACCESS_TOKEN ||
    process.env.BRIDGE_API_TOKEN ||
    process.env.ZILLOW_SERVER_TOKEN ||
    ""
  );
}

export function isBridgeConfigured() {
  return Boolean(getBridgeServerToken());
}

export function getDefaultBridgeDatasetId() {
  return process.env.BRIDGE_DATASET_ID || "";
}

function getBridgeBaseUrl() {
  return (process.env.BRIDGE_API_BASE_URL || DEFAULT_BRIDGE_BASE_URL).replace(/\/$/, "");
}

function toUrl(path: string, params: Record<string, BridgeQueryValue> = {}) {
  const url = new URL(`${getBridgeBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url;
}

export async function bridgeFetch<T = unknown>(
  path: string,
  options: BridgeRequestOptions = {},
): Promise<BridgeResponse<T>> {
  const token = getBridgeServerToken();
  if (!token) {
    throw new Error("Bridge is not configured. Add BRIDGE_SERVER_TOKEN to your environment.");
  }

  const url = toUrl(path, options.params);
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message: unknown }).message)
        : `Bridge request failed with status ${response.status}`;

    throw new Error(message);
  }

  return { data: data as T, url: url.toString() };
}

export function pickBridgeItems(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const record = data as Record<string, unknown>;
  for (const key of ["value", "bundle", "items", "data", "results"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}
