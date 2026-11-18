import { z } from "zod";
import { richTextField } from "@/lib/rich-text";
import { optionalHttpsUrl, optionalId, optionalText, slugField, stackField } from "./fields";

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

const sectionFields = Object.fromEntries(QUEST_SECTIONS.map((s) => [s.key, richTextField])) as {
  [K in QuestSection]: typeof richTextField;
};

/** A quest (case study) as edited in the admin. */
export const questSchema = z.object({
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
  status: z.enum(["DRAFT", "PUBLISHED"]),
  featured: z.boolean(),
});

export type QuestInput = z.infer<typeof questSchema>;

/** Reads the quest editor's form fields into the shape `questSchema` expects. */
export function questFormValues(formData: FormData) {
  const text = (name: string) => formData.get(name) ?? "";
  return {
    title: text("title"),
    slug: text("slug"),
    kind: formData.get("kind"),
    rarity: formData.get("rarity"),
    client: text("client"),
    role: text("role"),
    summary: text("summary"),
    stack: text("stack"),
    repoUrl: text("repoUrl"),
    liveUrl: text("liveUrl"),
    chapterId: text("chapterId"),
    diagramId: text("diagramId"),
    ...Object.fromEntries(QUEST_SECTIONS.map((s) => [s.key, text(s.key)])),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
  };
}
