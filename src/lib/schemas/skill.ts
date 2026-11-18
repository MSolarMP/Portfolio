import { z } from "zod";
import { requiredText } from "./fields";

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
export const skillSchema = z.object({
  name: requiredText(40, "Name the skill."),
  category: z.enum(categoryKeys, "Pick a category."),
  headline: z.boolean(),
});

export function skillFormValues(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    category: formData.get("category"),
    headline: formData.get("headline") === "on",
  };
}
