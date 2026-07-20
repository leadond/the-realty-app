import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import { bridgeFetch, isBridgeConfigured } from "@/lib/integrations/bridge";

export const dynamic = "force-dynamic";

export async function GET() {
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
