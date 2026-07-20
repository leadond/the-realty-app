import { put, del } from "@vercel/blob";

export function isStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export type UploadedBlob = {
  url: string;
  pathname: string;
};

/**
 * Uploads a file to Vercel Blob under a per-user, collision-proof path.
 * Throws if storage isn't configured — callers should gate with
 * isStorageConfigured() and return a 503 first.
 */
export async function uploadUserFile(
  userId: string,
  file: File,
): Promise<UploadedBlob> {
  if (!isStorageConfigured()) {
    throw new Error("Storage is not configured. Add BLOB_READ_WRITE_TOKEN to your environment.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
  const key = `${userId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const blob = await put(key, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return { url: blob.url, pathname: blob.pathname };
}

/** Best-effort blob deletion; never throws so it can't block a DB delete. */
export async function deleteUserFile(url: string) {
  if (!isStorageConfigured()) return;
  try {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch {
    // Orphaned blobs are acceptable; the DB row is the source of truth.
  }
}
