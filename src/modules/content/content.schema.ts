import { z } from "zod";
import { richDocField } from "@/lib/rich-text";

export const CONTENT_TEXT_MAX = 2000;

/** Saving a plain-text block (the key identifies the block; it isn't part of the body). */
export const contentTextSchema = z.strictObject({
  text: z
    .string()
    .trim()
    .min(1, "Copy can't be empty.")
    .max(CONTENT_TEXT_MAX, `Keep it under ${CONTENT_TEXT_MAX} characters.`),
});

/** Saving a rich-text block: a Tiptap document, cleaned by the allow-list. */
export const contentRichSchema = z.strictObject({
  rich: richDocField.refine((doc) => doc !== null, "Copy can't be empty."),
});

/** Block keys look like `home.hero.tagline`. */
export const contentKeySchema = z
  .string()
  .max(120)
  .regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i);
