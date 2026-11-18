import { z } from "zod";

export const STATS_MAX = 6;
export const TAGLINE_MAX = 160;

/** Lowercase words joined by single hyphens, e.g. "trail-running". */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Trail Running & Hiking!" → "trail-running-hiking". Used to suggest a slug from the title. */
export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

// Blank optional text becomes null, so the DB stores "nothing" rather than "".
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .transform((v) => v || null);

const statSchema = z.object({
  label: z.string().trim().min(1, "Every stat needs a label.").max(40),
  value: z.string().trim().min(1, "Every stat needs a value.").max(40),
});

/** A side quest (the `Interest` model) as edited in the admin. Body and cover are edited elsewhere. */
export const interestSchema = z.object({
  title: z.string().trim().min(1, "Give it a title.").max(80, "Keep it under 80 characters."),
  slug: z
    .string()
    .trim()
    .min(1, "Give it a slug.")
    .max(60, "Keep it under 60 characters.")
    .regex(SLUG_PATTERN, "Lowercase letters, numbers and single hyphens only."),
  tagline: optionalText(TAGLINE_MAX),
  attribute: optionalText(40),
  stats: z.array(statSchema).max(STATS_MAX, `Up to ${STATS_MAX} stats.`),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  featured: z.boolean(),
});

export type InterestInput = z.infer<typeof interestSchema>;
export type Stat = z.infer<typeof statSchema>;

/**
 * Turns the editor's form fields into the shape `interestSchema` expects.
 * Stats arrive as repeated `statLabel` / `statValue` fields; fully blank rows are dropped.
 */
export function interestFormValues(formData: FormData) {
  const labels = formData.getAll("statLabel").map(String);
  const values = formData.getAll("statValue").map(String);
  const stats = labels
    .map((label, i) => ({ label, value: values[i] ?? "" }))
    .filter((s) => s.label.trim() || s.value.trim());

  return {
    title: formData.get("title") ?? "",
    slug: formData.get("slug") ?? "",
    tagline: formData.get("tagline") ?? "",
    attribute: formData.get("attribute") ?? "",
    stats,
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
  };
}

/** New display order for the side quests list: every id, top to bottom. */
export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});
