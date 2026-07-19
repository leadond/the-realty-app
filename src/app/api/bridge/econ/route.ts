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
  const report = searchParams.get("report") === "marketreport" ? "marketreport" : "region";
  const params: Record<string, BridgeQueryValue> = {};

  for (const key of ["stateCodeFIPS", "countyCodeFIPS", "regionId", "regionType", "city", "state", "zip"]) {
    params[key] = searchParams.get(key);
  }

  try {
    const result = await bridgeFetch(`/api/v2/zgecon/${report}`, { params });
    return NextResponse.json({
      ok: true,
      configured: true,
      report,
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
