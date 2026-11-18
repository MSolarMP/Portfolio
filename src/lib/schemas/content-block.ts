import { z } from "zod";
import { richTextField } from "@/lib/rich-text";

export const CONTENT_TEXT_MAX = 2000;

/** Editing one plain-text ContentBlock. */
export const contentBlockTextSchema = z.object({
  key: z.string().min(1).max(120),
  text: z
    .string()
    .trim()
    .min(1, "Copy can't be empty.")
    .max(CONTENT_TEXT_MAX, `Keep it under ${CONTENT_TEXT_MAX} characters.`),
});

export type ContentBlockTextInput = z.infer<typeof contentBlockTextSchema>;

/** Editing one rich-text ContentBlock: the editor's Tiptap JSON, cleaned by the allow-list. */
export const contentBlockRichSchema = z.object({
  key: z.string().min(1).max(120),
  rich: richTextField.refine((doc) => doc !== null, "Copy can't be empty."),
});
