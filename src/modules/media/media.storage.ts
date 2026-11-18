import "server-only";

/**
 * Supabase Storage over its REST API with plain `fetch` (no SDK).
 * The secret key goes in the `apikey` header and bypasses Storage access rules,
 * so this module must only ever run on the server.
 */

export const buckets = {
  /** Private: full-size uploads, which may still carry GPS in their metadata. */
  originals: process.env.SUPABASE_BUCKET_ORIGINALS || "originals",
  /** Public: resized, metadata-free copies that the site shows. */
  public: process.env.SUPABASE_BUCKET_PUBLIC || "media",
};

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Media storage isn't configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
  return { url, key };
}

// Each path segment is encoded; the slashes between them are kept.
const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

/**
 * Uploads (or replaces) one object. Paths never get reused for different content,
 * so files can be cached by browsers and the CDN for a year.
 */
export async function putObject(
  bucket: string,
  path: string,
  body: Uint8Array,
  contentType: string,
) {
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${encodePath(path)}`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": contentType,
      "x-upsert": "true",
      "cache-control": "max-age=31536000",
    },
    // Copy into a plain ArrayBuffer-backed array, which is what Blob accepts.
    body: new Blob([new Uint8Array(body)], { type: contentType }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Storage upload failed (${res.status}): ${await res.text()}`);
}

/** Deletes objects; paths that don't exist are ignored. */
export async function removeObjects(bucket: string, paths: string[]) {
  if (paths.length === 0) return;
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Storage delete failed (${res.status}): ${await res.text()}`);
}

/** The public (CDN) address of a file in the public bucket. */
export function publicUrl(path: string) {
  return `${config().url}/storage/v1/object/public/${buckets.public}/${encodePath(path)}`;
}
