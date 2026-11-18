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
 * `label`/`hint` are for the admin (plain, themed name in brackets); `title` is the public
 * heading on the case study page.
 */
export const QUEST_SECTIONS = [
  {
    key: "briefing",
    title: "The briefing",
    label: "Briefing (context)",
    hint: "Who the client was and what they needed.",
  },
  {
    key: "problem",
    title: "The problem",
    label: "Problem",
    hint: "What was broken, slow or missing.",
  },
  {
    key: "constraints",
    title: "Constraints",
    label: "Constraints",
    hint: "Deadlines, legacy systems, team size, budget.",
  },
  {
    key: "approach",
    title: "The approach",
    label: "Approach",
    hint: "What you built and why, step by step.",
  },
  {
    key: "bossFight",
    title: "Boss fight",
    label: "Boss fight (hardest problem)",
    hint: "The hardest problem and how you beat it.",
  },
  {
    key: "outcome",
    title: "Outcome",
    label: "Outcome",
    hint: "Results, numbers, what changed for the client.",
  },
  {
    key: "loot",
    title: "Loot",
    label: "Loot (lessons learned)",
    hint: "What you'd take to the next quest.",
  },
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
