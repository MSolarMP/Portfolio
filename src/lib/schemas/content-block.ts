import { z } from "zod";

export const CONTENT_TEXT_MAX = 2000;

/** Editing one plain-text ContentBlock. Rich-text blocks get their own schema with Tiptap. */
export const contentBlockTextSchema = z.object({
  key: z.string().min(1).max(120),
  text: z
    .string()
    .trim()
    .min(1, "Copy can't be empty.")
    .max(CONTENT_TEXT_MAX, `Keep it under ${CONTENT_TEXT_MAX} characters.`),
});

export type ContentBlockTextInput = z.infer<typeof contentBlockTextSchema>;
