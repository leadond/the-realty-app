import { NextResponse } from "next/server";
import type { DocumentType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";
import { isStorageConfigured, uploadUserFile } from "@/lib/storage/blob";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

function inferType(mimeType: string | null): DocumentType {
  if (mimeType?.startsWith("image/")) return "PHOTO";
  return "OTHER";
}

function parseTags(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const tags = raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length > 0 ? JSON.stringify(tags) : null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "file-storage");
  if (denied) return denied;

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, documents });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "file-storage");
  if (denied) return denied;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Storage is not configured. Add a BLOB_READ_WRITE_TOKEN environment variable (Vercel → Storage → Blob) to enable uploads.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ ok: false, error: "File exceeds the 25 MB limit" }, { status: 400 });
  }

  const propertyId = typeof form.get("propertyId") === "string" ? String(form.get("propertyId")).trim() : "";
  const transactionId =
    typeof form.get("transactionId") === "string" ? String(form.get("transactionId")).trim() : "";

  if (propertyId) {
    const owned = await prisma.property.findFirst({
      where: { id: propertyId, userId: user.id },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ ok: false, error: "Invalid propertyId" }, { status: 400 });
  }
  if (transactionId) {
    const owned = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: user.id },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ ok: false, error: "Invalid transactionId" }, { status: 400 });
  }

  const mimeType = file.type || null;

  let url: string;
  try {
    const uploaded = await uploadUserFile(user.id, file);
    url = uploaded.url;
  } catch {
    return NextResponse.json({ ok: false, error: "Upload failed. Please try again." }, { status: 502 });
  }

  const document = await prisma.document.create({
    data: {
      userId: user.id,
      name: file.name || "Untitled",
      type: inferType(mimeType),
      url,
      size: file.size,
      mimeType,
      propertyId: propertyId || null,
      transactionId: transactionId || null,
      tags: parseTags(form.get("tags")),
    },
  });

  return NextResponse.json({ ok: true, document }, { status: 201 });
}
