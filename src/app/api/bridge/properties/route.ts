import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import {
  bridgeFetch,
  getDefaultBridgeDatasetId,
  isBridgeConfigured,
  pickBridgeItems,
  type BridgeQueryValue,
} from "@/lib/integrations/bridge";

export const dynamic = "force-dynamic";

function quoteOData(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function buildFilter(params: URLSearchParams) {
  const filters: string[] = [];
  const listingId = params.get("listingId")?.trim();
  const postalCode = params.get("postalCode")?.trim();
  const address = params.get("address")?.trim();
  const city = params.get("city")?.trim();
  const status = params.get("status")?.trim() || "Active";
  const propertyType = params.get("propertyType")?.trim();
  const minPrice = params.get("minPrice")?.trim();
  const maxPrice = params.get("maxPrice")?.trim();

  if (listingId) filters.push(`ListingId eq ${quoteOData(listingId)}`);
  if (postalCode) filters.push(`PostalCode eq ${quoteOData(postalCode)}`);
  if (address) filters.push(`contains(tolower(UnparsedAddress), ${quoteOData(address.toLowerCase())})`);
  if (city) filters.push(`tolower(City) eq ${quoteOData(city.toLowerCase())}`);
  if (status) filters.push(`StandardStatus eq ${quoteOData(status)}`);
  if (propertyType) filters.push(`PropertyType eq ${quoteOData(propertyType)}`);
  if (minPrice) filters.push(`ListPrice ge ${Number(minPrice) || 0}`);
  if (maxPrice) filters.push(`ListPrice le ${Number(maxPrice) || 0}`);

  return filters.join(" and ");
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "zillow-bridge");
  if (denied) return denied;

  if (!isBridgeConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Add BRIDGE_SERVER_TOKEN to enable Bridge data access." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get("datasetId")?.trim() || getDefaultBridgeDatasetId();
  if (!datasetId) {
    return NextResponse.json(
      { ok: false, configured: true, error: "Choose a Bridge dataset or set BRIDGE_DATASET_ID." },
      { status: 400 },
    );
  }

  const top = Math.min(Number(searchParams.get("limit") || 10) || 10, 50);
  const query: Record<string, BridgeQueryValue> = {
    $top: top,
    $orderby: searchParams.get("orderBy") || "ModificationTimestamp desc",
  };

  const filter = buildFilter(searchParams);
  if (filter) query.$filter = filter;

  const select = searchParams.get("select")?.trim();
  if (select) query.$select = select;

  const expand = searchParams.get("expand")?.trim();
  if (expand) query.$expand = expand;

  try {
    const result = await bridgeFetch(`/api/v2/OData/${encodeURIComponent(datasetId)}/Property`, {
      params: query,
    });

    return NextResponse.json({
      ok: true,
      configured: true,
      datasetId,
      count: pickBridgeItems(result.data).length,
      data: result.data,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, configured: true, error: error instanceof Error ? error.message : "Bridge request failed" },
      { status: 502 },
    );
  }
}
