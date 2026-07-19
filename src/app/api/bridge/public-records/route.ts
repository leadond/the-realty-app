import { NextResponse } from "next/server";

import { bridgeFetch, isBridgeConfigured, pickBridgeItems, type BridgeQueryValue } from "@/lib/integrations/bridge";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isBridgeConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Add BRIDGE_SERVER_TOKEN to enable Bridge data access." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parcelId = searchParams.get("parcelId")?.trim();
  const zpid = searchParams.get("zpid")?.trim();
  const address = searchParams.get("address")?.trim();

  if (!parcelId && !zpid && !address) {
    return NextResponse.json(
      { ok: false, configured: true, error: "Enter a parcel ID, zpid, or address." },
      { status: 400 },
    );
  }

  const path = parcelId
    ? `/api/v2/pub/parcels/${encodeURIComponent(parcelId)}/transactions`
    : "/api/v2/pub/assessments";

  const params: Record<string, BridgeQueryValue> = {};
  if (zpid) params.zpid = zpid;
  if (address) params["address.full"] = address;

  try {
    const result = await bridgeFetch(path, { params });
    return NextResponse.json({
      ok: true,
      configured: true,
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
