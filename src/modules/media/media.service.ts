import "server-only";
import { randomUUID } from "node:crypto";
import { invalidate } from "@/lib/cache";
import { tags } from "@/lib/cache-tags";
import { NotFoundError, UnavailableError, ValidationError } from "@/lib/errors";
import { processImage, type ProcessedImage, type VariantFormat } from "./media.process";
import * as repo from "./media.repository";
import type { MediaDetails } from "./media.schema";
import { buckets, publicUrl, putObject, removeObjects } from "./media.storage";

/**
 * The media vault: a handful of display images (covers, diagrams, the portrait).
 * Upload → resize with sharp → store the original privately and metadata-free copies
 * publicly → save the row. Other modules use `publicImageSelect` + `toPublicImage`
 * to show an image and `mediaExists` to check a picked one is still there.
 */

const RESOURCE = "Image";

/** `Media.variants`: { avif: { "640": path, … }, webp: { … } } — paths in the public bucket. */
export type VariantMap = Partial<Record<VariantFormat, Record<string, string>>>;

function readVariants(json: unknown): VariantMap {
  return json && typeof json === "object" ? (json as VariantMap) : {};
}

/** The URL of the widest variant of `format` that is at most `maxWidth` (or the smallest one). */
function variantUrl(variants: VariantMap, format: VariantFormat, maxWidth: number) {
  const entries = Object.entries(variants[format] ?? {})
    .map(([w, path]) => [Number(w), path] as const)
    .sort((a, b) => a[0] - b[0]);
  const pick = entries.filter(([w]) => w <= maxWidth).at(-1) ?? entries[0];
  return pick ? publicUrl(pick[1]) : null;
}

/** Media covers and diagrams appear on side quests and quests, so their caches go too. */
function invalidateImages() {
  invalidate(tags.media, tags.interests, tags.quests);
}

// ── For other modules ────────────────────────────────────────

/** What the public site needs to draw one image as a responsive <picture>. */
export type PublicImage = {
  avifSrcSet: string;
  webpSrcSet: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  blurData: string | null;
};

/** The columns another module's repository selects on a Media relation, for `toPublicImage()`. */
export const publicImageSelect = {
  state: true,
  variants: true,
  width: true,
  height: true,
  alt: true,
  blurData: true,
} as const;

/** A READY image with its variants as srcsets, or null if it can't be shown. */
export function toPublicImage(
  media: {
    state: string;
    variants: unknown;
    width: number | null;
    height: number | null;
    alt: string | null;
    blurData: string | null;
  } | null,
): PublicImage | null {
  if (!media || media.state !== "READY" || !media.width || !media.height) return null;
  const variants = readVariants(media.variants);
  const srcSet = (format: VariantFormat) =>
    Object.entries(variants[format] ?? {})
      .map(([w, path]) => `${publicUrl(path)} ${w}w`)
      .join(", ");
  const src = variantUrl(variants, "webp", 1280);
  if (!src) return null;
  return {
    avifSrcSet: srcSet("avif"),
    webpSrcSet: srcSet("webp"),
    src,
    width: media.width,
    height: media.height,
    alt: media.alt ?? "",
    blurData: media.blurData,
  };
}

/** True if `id` is an image in the vault. Used to check a picked cover/diagram still exists. */
export function mediaExists(id: string) {
  return repo.exists(id);
}

// ── Admin reads ──────────────────────────────────────────────

/** The vault grid, newest first. */
export async function listMedia() {
  return (await repo.findAll()).map(({ variants, ...r }) => ({
    ...r,
    thumbUrl: variantUrl(readVariants(variants), "webp", 640),
  }));
}

/** One image with its preview, every public file and where it's used. Throws NotFoundError. */
export async function getMedia(id: string) {
  const row = await repo.findByIdWithUsage(id);
  if (!row) throw new NotFoundError(RESOURCE);
  const variants = readVariants(row.variants);
  return {
    ...row,
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

/** The choices for a media picker (cover, diagram), newest first. */
export async function listMediaOptions() {
  return (await repo.findReadyImages()).map(({ variants, ...r }) => ({
    ...r,
    thumbUrl: variantUrl(readVariants(variants), "webp", 640),
  }));
}
export type MediaOption = Awaited<ReturnType<typeof listMediaOptions>>[number];

// ── Writes ───────────────────────────────────────────────────

const EXT: Record<ProcessedImage["format"], string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
};

/**
 * Stores a new image. Throws ValidationError (not a readable image) or
 * UnavailableError (storage failed; anything already written is removed again).
 */
export async function uploadImage(
  file: { name: string; size: number; bytes: Buffer },
  details: MediaDetails,
) {
  let image: ProcessedImage;
  try {
    image = await processImage(file.bytes);
  } catch {
    throw new ValidationError({
      file: "That file couldn't be read as a JPEG, PNG, WebP or AVIF image.",
    });
  }

  const id = randomUUID();
  const key = `${id}/original.${EXT[image.format]}`;
  const variants: VariantMap = {};
  const publicPaths: string[] = [];
  for (const v of image.variants) {
    const path = `${id}/${v.width}.${v.format}`;
    (variants[v.format] ??= {})[v.width] = path;
    publicPaths.push(path);
  }

  try {
    await Promise.all([
      putObject(buckets.originals, key, file.bytes, `image/${image.format}`),
      ...image.variants.map((v) =>
        putObject(buckets.public, `${id}/${v.width}.${v.format}`, v.data, `image/${v.format}`),
      ),
    ]);
  } catch (err) {
    console.error("Media upload failed", err);
    await Promise.allSettled([
      removeObjects(buckets.originals, [key]),
      removeObjects(buckets.public, publicPaths),
    ]);
    throw new UnavailableError("The image couldn't be stored. Try again in a moment.");
  }

  await repo.create({
    id,
    kind: "IMAGE",
    state: "READY",
    key,
    filename: file.name.slice(0, 200) || `image.${EXT[image.format]}`,
    mimeType: `image/${image.format}`,
    bytes: file.size,
    width: image.width,
    height: image.height,
    blurData: image.blurData,
    variants,
    ...details,
  });
  invalidateImages();
  return { id };
}

/** Alt text and caption. Throws NotFoundError. */
export async function updateMediaDetails(id: string, details: MediaDetails) {
  if (!(await repo.updateDetails(id, details))) throw new NotFoundError(RESOURCE);
  invalidateImages();
}

/** Removes the files from both buckets, then the row. Idempotent. Throws UnavailableError. */
export async function deleteMedia(id: string) {
  const row = await repo.findFiles(id);
  if (!row) return;
  const variants = readVariants(row.variants);
  const publicPaths = Object.values(variants).flatMap((byWidth) => Object.values(byWidth ?? {}));
  try {
    await Promise.all([
      removeObjects(buckets.originals, [row.key]),
      removeObjects(buckets.public, publicPaths),
    ]);
  } catch (err) {
    console.error("Media delete failed", err);
    throw new UnavailableError("The files couldn't be deleted. Try again in a moment.");
  }
  await repo.remove(id);
  invalidateImages();
}
