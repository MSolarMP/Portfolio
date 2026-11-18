import { z } from "zod";
import { requiredText } from "@/lib/validation/fields";

/** Skill tree branches, in display order. `key` is what's stored in `Skill.category`. */
export const SKILL_CATEGORIES = [
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "data", label: "Data" },
  { key: "mobile", label: "Mobile" },
  { key: "cloud", label: "Cloud & tooling" },
  { key: "ai", label: "AI" },
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number]["key"];

const categoryKeys = SKILL_CATEGORIES.map((c) => c.key) as [SkillCategory, ...SkillCategory[]];

/** One skill. `headline` skills are shown larger on the skill tree. */
export const skillSchema = z.strictObject({
  name: requiredText(40, "Name the skill."),
  category: z.enum(categoryKeys, "Pick a category."),
  headline: z.boolean(),
});

/** Editing a skill: any subset of fields. Changing category moves it to the bottom of the new list. */
export const skillUpdateSchema = skillSchema.partial();

export type SkillInput = z.output<typeof skillSchema>;
export type SkillUpdate = z.output<typeof skillUpdateSchema>;
