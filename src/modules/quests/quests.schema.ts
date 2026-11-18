import { z } from "zod";
import { richDocField } from "@/lib/rich-text";
import {
  optionalHttpsUrl,
  optionalId,
  optionalText,
  slugField,
  stackField,
} from "@/lib/validation/fields";

export const SUMMARY_MAX = 300;

/**
 * The case-study sections, in reading order. Each is a rich-text (Tiptap JSON) column on `Quest`.
 * Admin labels are plain, with the themed name in brackets (see the design vocabulary).
 */
export const QUEST_SECTIONS = [
  {
    key: "briefing",
    label: "Briefing (context)",
    hint: "Who the client was and what they needed.",
  },
  { key: "problem", label: "Problem", hint: "What was broken, slow or missing." },
  {
    key: "constraints",
    label: "Constraints",
    hint: "Deadlines, legacy systems, team size, budget.",
  },
  { key: "approach", label: "Approach", hint: "What you built and why, step by step." },
  {
    key: "bossFight",
    label: "Boss fight (hardest problem)",
    hint: "The hardest problem and how you beat it.",
  },
  { key: "outcome", label: "Outcome", hint: "Results, numbers, what changed for the client." },
  { key: "loot", label: "Loot (lessons learned)", hint: "What you'd take to the next quest." },
] as const;

export type QuestSection = (typeof QUEST_SECTIONS)[number]["key"];

/** Each section is a Tiptap document or null; a section left out of the body is null. */
const sectionFields = Object.fromEntries(QUEST_SECTIONS.map((s) => [s.key, richDocField])) as {
  [K in QuestSection]: typeof richDocField;
};

/** A quest (case study). Saving replaces the whole quest. */
export const questSchema = z.strictObject({
  title: z.string().trim().min(1, "Give it a title.").max(100, "Keep it under 100 characters."),
  slug: slugField(80),
  kind: z.enum(["CLIENT", "PERSONAL"]),
  rarity: z.enum(["LEGENDARY", "EPIC", "RARE"]),
  client: optionalText(80),
  role: optionalText(80),
  summary: z
    .string()
    .trim()
    .min(1, "Write a one-line summary.")
    .max(SUMMARY_MAX, `Keep it under ${SUMMARY_MAX} characters.`),
  stack: stackField,
  repoUrl: optionalHttpsUrl(),
  liveUrl: optionalHttpsUrl(),
  chapterId: optionalId,
  /** Media id of the architecture diagram. */
  diagramId: optionalId,
  ...sectionFields,
  status: z.enum(["DRAFT", "PUBLISHED"], "Pick draft or published."),
  featured: z.boolean(),
});

export type QuestInput = z.output<typeof questSchema>;
