import { z } from "zod";

/** Field builders shared by the admin entity schemas. */

/** Lowercase words joined by single hyphens, e.g. "trail-running". */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Trail Running & Hiking!" → "trail-running-hiking". Used to suggest a slug from the title. */
export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // accents split off by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export function slugField(max: number) {
  return z
    .string()
    .trim()
    .min(1, "Give it a slug.")
    .max(max, `Keep it under ${max} characters.`)
    .regex(SLUG_PATTERN, "Lowercase letters, numbers and single hyphens only.");
}

/** Required text, trimmed. */
export function requiredText(max: number, emptyMessage: string) {
  return z.string().trim().min(1, emptyMessage).max(max, `Keep it under ${max} characters.`);
}

/**
 * Optional text, trimmed. Accepts null or a string; blank becomes null,
 * so the DB stores "nothing" rather than "".
 */
export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .nullable()
    .transform((v) => v || null);
}

/**
 * An optional https link; blank becomes null. Pass `pattern` to narrow it further,
 * e.g. to linkedin.com addresses.
 */
export function optionalHttpsUrl(
  pattern = /^https:\/\/[^\s/]+\.[^\s]+$/i,
  message = "Use a full https:// address.",
) {
  return z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || pattern.test(v), message)
    .nullable()
    .transform((v) => v || null);
}

/** "Next.js, Tailwind CSS ,  next.js" → ["Next.js", "Tailwind CSS"] (case-insensitive de-dupe). */
export function parseStack(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
}

export const STACK_MAX = 20;

/**
 * A technology list: a JSON array of names, or one comma-separated string as typed into
 * an input. Either way it's trimmed and de-duplicated (ignoring case).
 */
export const stackField = z
  .union([
    z.string().max(1000).transform(parseStack),
    z
      .array(z.string().max(100))
      .max(100)
      .transform((items) => parseStack(items.join(","))),
  ])
  .pipe(
    z
      .array(z.string().max(30, "Keep each technology under 30 characters."))
      .max(STACK_MAX, `Up to ${STACK_MAX} technologies.`),
  );

/** An optional reference to another record (e.g. a Media id); null or blank means none. */
export const optionalId = z
  .string()
  .trim()
  .max(100)
  .nullable()
  .transform((v) => v || null);
