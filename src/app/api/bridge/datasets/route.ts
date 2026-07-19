import { NextResponse } from "next/server";

import { bridgeFetch, isBridgeConfigured } from "@/lib/integrations/bridge";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isBridgeConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Add BRIDGE_SERVER_TOKEN to enable Bridge data access." },
      { status: 503 },
    );
  }

  try {
    const result = await bridgeFetch("/api/v2/datasets");
    return NextResponse.json({ ok: true, configured: true, data: result.data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, configured: true, error: error instanceof Error ? error.message : "Bridge request failed" },
      { status: 502 },
    );
  }
}
