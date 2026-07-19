import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

/** TEMPORARY diagnostic route — lists available Gemini models for the configured key. Remove after use. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 503 });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();

  const models = Array.isArray(data.models)
    ? data.models
        .filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: { name: string; displayName?: string }) => ({ name: m.name, displayName: m.displayName }))
    : data;

  return NextResponse.json({ ok: res.ok, models });
}
