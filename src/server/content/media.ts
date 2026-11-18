import "server-only";
import { db } from "@/server/db";
import type { ImageLore, VariantFormat } from "@/server/media/process";
import { publicUrl } from "@/server/media/storage";

/** `Media.variants`: { avif: { "640": path, … }, webp: { … } } — paths in the public bucket. */
export type VariantMap = Partial<Record<VariantFormat, Record<string, string>>>;

function readVariants(json: unknown): VariantMap {
  return json && typeof json === "object" ? (json as VariantMap) : {};
}

/** The URL of the widest variant of `format` that is at most `maxWidth` (or the smallest one). */
export function variantUrl(variants: VariantMap, format: VariantFormat, maxWidth: number) {
  const entries = Object.entries(variants[format] ?? {})
    .map(([w, path]) => [Number(w), path] as const)
    .sort((a, b) => a[0] - b[0]);
  const pick = entries.filter(([w]) => w <= maxWidth).at(-1) ?? entries[0];
  return pick ? publicUrl(pick[1]) : null;
}

/** Admin: the vault grid, newest first. */
export async function listMedia() {
  const rows = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      width: true,
      height: true,
      bytes: true,
      alt: true,
      blurData: true,
      variants: true,
      state: true,
    },
  });
  return rows.map(({ variants, ...r }) => ({
    ...r,
    thumbUrl: variantUrl(readVariants(variants), "webp", 640),
  }));
}

/** Admin: one image with its preview, every public file, its lore and where it's used. */
export async function getMedia(id: string) {
  const row = await db.media.findUnique({
    where: { id },
    include: {
      coverOf: { select: { id: true, title: true } },
      diagramOf: { select: { id: true, title: true } },
    },
  });
  if (!row) return null;
  const variants = readVariants(row.variants);
  return {
    ...row,
    lore: (row.exif ?? null) as ImageLore | null,
    previewUrl: variantUrl(variants, "webp", 1280),
    files: Object.entries(variants).flatMap(([format, byWidth]) =>
      Object.entries(byWidth ?? {}).map(([width, path]) => ({
        format,
        width: Number(width),
        url: publicUrl(path),
      })),
    ),
  };
}
