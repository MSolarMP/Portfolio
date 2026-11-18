import { z } from "zod";
import { richTextField } from "@/lib/rich-text";
import { optionalText, slugField } from "./fields";

export const STATS_MAX = 6;
export const TAGLINE_MAX = 160;

const statSchema = z.object({
  label: z.string().trim().min(1, "Every stat needs a label.").max(40),
  value: z.string().trim().min(1, "Every stat needs a value.").max(40),
});

/** A side quest (the `Interest` model) as edited in the admin. The cover arrives with the Media vault. */
export const interestSchema = z.object({
  title: z.string().trim().min(1, "Give it a title.").max(80, "Keep it under 80 characters."),
  slug: slugField(60),
  tagline: optionalText(TAGLINE_MAX),
  attribute: optionalText(40),
  body: richTextField,
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
    body: formData.get("body") ?? "",
    stats,
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
  };
}
