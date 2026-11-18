import "server-only";
import exifr from "exifr";
import sharp from "sharp";

/** Widths the site picks from with `srcset`. Images are never enlarged. */
export const VARIANT_WIDTHS = [640, 1280, 1920] as const;
export const VARIANT_FORMATS = ["avif", "webp"] as const;
export type VariantFormat = (typeof VARIANT_FORMATS)[number];

/** Camera details shown as "item lore". GPS is never read. */
export type ImageLore = {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: number;
  focalLength?: string;
  takenAt?: string; // ISO date-time
};

export type ProcessedImage = {
  /** What the file really is, according to its contents (not its name or the browser). */
  format: "jpeg" | "png" | "webp" | "avif";
  width: number;
  height: number;
  /** Tiny WebP as a data URL, shown blurred while the real image loads. */
  blurData: string;
  lore: ImageLore | null;
  variants: { format: VariantFormat; width: number; data: Buffer }[];
};

const INPUT_FORMATS = { jpeg: "jpeg", png: "png", webp: "webp", heif: "avif" } as const;

/** The widths to make for an image `width` pixels wide: the standard ones below it, plus its own size up to 1920. */
export function variantWidths(width: number): number[] {
  const largest = Math.min(width, VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1]);
  return [...new Set([...VARIANT_WIDTHS.filter((w) => w < largest), largest])];
}

/**
 * Turns an uploaded image into the files the site serves: AVIF + WebP at each width,
 * plus a blur placeholder. sharp drops all metadata (EXIF, GPS, colour profiles are
 * converted to sRGB) unless asked to keep it, so nothing private reaches the public bucket.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const meta = await sharp(input).metadata();
  const format = INPUT_FORMATS[meta.format as keyof typeof INPUT_FORMATS];
  if (!format) throw new Error(`Unsupported image format: ${meta.format ?? "unknown"}`);

  // Phone photos are often stored sideways with an "orientation" flag; rotate() applies it.
  const width = meta.autoOrient?.width ?? meta.width;
  const height = meta.autoOrient?.height ?? meta.height;
  if (!width || !height) throw new Error("Couldn't read the image size.");

  const base = sharp(input).rotate();

  const variants = await Promise.all(
    variantWidths(width).flatMap((w) =>
      VARIANT_FORMATS.map(async (f) => {
        const resized = base.clone().resize({ width: w, withoutEnlargement: true });
        const data = await (
          f === "avif" ? resized.avif({ quality: 55, effort: 4 }) : resized.webp({ quality: 78 })
        ).toBuffer();
        return { format: f, width: w, data };
      }),
    ),
  );

  const blur = await base.clone().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();

  return {
    format,
    width,
    height,
    blurData: `data:image/webp;base64,${blur.toString("base64")}`,
    lore: await readLore(input),
    variants,
  };
}

/** Reads camera settings from EXIF. Only these tags are parsed; GPS is never touched. */
export async function readLore(input: Buffer): Promise<ImageLore | null> {
  let raw: Record<string, unknown> | undefined;
  try {
    raw = await exifr.parse(input, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FNumber",
        "ExposureTime",
        "ISO",
        "FocalLength",
        "DateTimeOriginal",
      ],
      gps: false,
    });
  } catch {
    return null; // no or unreadable EXIF is normal (screenshots, PNGs, edited exports)
  }
  if (!raw) return null;

  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

  const make = text(raw.Make);
  const model = text(raw.Model);
  const fNumber = num(raw.FNumber);
  const exposure = num(raw.ExposureTime);
  const focal = num(raw.FocalLength);
  const taken = raw.DateTimeOriginal instanceof Date ? raw.DateTimeOriginal : undefined;

  const lore: ImageLore = {
    // "Canon" + "Canon EOS R6" → "Canon EOS R6"
    camera: make && model ? (model.startsWith(make) ? model : `${make} ${model}`) : (model ?? make),
    lens: text(raw.LensModel),
    aperture: fNumber ? `f/${fNumber}` : undefined,
    shutter: exposure
      ? exposure < 1
        ? `1/${Math.round(1 / exposure)}s`
        : `${exposure}s`
      : undefined,
    iso: num(raw.ISO),
    focalLength: focal ? `${Math.round(focal)}mm` : undefined,
    takenAt: taken && !Number.isNaN(taken.getTime()) ? taken.toISOString() : undefined,
  };
  const kept = Object.fromEntries(Object.entries(lore).filter(([, v]) => v !== undefined));
  return Object.keys(kept).length ? (kept as ImageLore) : null;
}
