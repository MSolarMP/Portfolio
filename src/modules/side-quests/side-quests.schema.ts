import { z } from "zod";
import { richDocField } from "@/lib/rich-text";
import { optionalId, optionalText, slugField } from "@/lib/validation/fields";

export const STATS_MAX = 6;
export const TAGLINE_MAX = 160;

const statSchema = z.object({
  label: z.string().trim().min(1, "Every stat needs a label.").max(40),
  value: z.string().trim().min(1, "Every stat needs a value.").max(40),
});

/** Every field of a side quest (the `Interest` model) as sent to the API. */
const fields = {
  title: z.string().trim().min(1, "Give it a title.").max(80, "Keep it under 80 characters."),
  slug: slugField(60),
  tagline: optionalText(TAGLINE_MAX),
  attribute: optionalText(40),
  /** Tiptap document, or null. */
  body: richDocField,
  /** Media id of the cover image, or null. */
  coverId: optionalId,
  stats: z.array(statSchema).max(STATS_MAX, `Up to ${STATS_MAX} stats.`),
  status: z.enum(["DRAFT", "PUBLISHED"], "Pick draft or published."),
  featured: z.boolean(),
};

/** Creating: title and slug required; anything left out takes its database default. */
export const sideQuestCreateSchema = z
  .strictObject(fields)
  .partial()
  .required({ title: true, slug: true });

/** Updating: any subset of fields. Unknown fields are refused. */
export const sideQuestUpdateSchema = z.strictObject(fields).partial();

export type SideQuestCreate = z.output<typeof sideQuestCreateSchema>;
export type SideQuestUpdate = z.output<typeof sideQuestUpdateSchema>;
export type Stat = z.infer<typeof statSchema>;
