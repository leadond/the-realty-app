import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { setSecret, clearSecret, MANAGED_SECRET_KEYS, type ManagedSecretKey } from "@/lib/secrets";

function isManagedKey(key: unknown): key is ManagedSecretKey {
  return typeof key === "string" && (MANAGED_SECRET_KEYS as readonly string[]).includes(key);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const key = body?.key;
  const value = typeof body?.value === "string" ? body.value.trim() : "";

  if (!isManagedKey(key)) {
    return NextResponse.json({ ok: false, error: "Unknown or unmanaged key" }, { status: 400 });
  }
  if (!value) {
    return NextResponse.json({ ok: false, error: "Value is required" }, { status: 400 });
  }
  if (value.length > 2000) {
    return NextResponse.json({ ok: false, error: "Value is too long" }, { status: 400 });
  }

  await setSecret(key, value, user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const key = body?.key;

  if (!isManagedKey(key)) {
    return NextResponse.json({ ok: false, error: "Unknown or unmanaged key" }, { status: 400 });
  }

  await clearSecret(key);
  return NextResponse.json({ ok: true });
}
