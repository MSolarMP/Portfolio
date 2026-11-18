import { z } from "zod";
import { optionalText, requiredText, stackField } from "./fields";

export const BULLETS_MAX = 8;
export const CHAPTER_SUMMARY_MAX = 300;

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** "2026-08" (what <input type="month"> posts) → 1 Aug 2026, as a UTC date for a `date` column. */
export function monthToDate(month: string) {
  return new Date(`${month}-01T00:00:00Z`);
}

/** The reverse, for filling the form: a `date` column → "2026-08". */
export function dateToMonth(date: Date | null) {
  return date ? date.toISOString().slice(0, 7) : "";
}

const month = z.string().trim().regex(MONTH, "Pick a month.");

/** A Chronicle chapter (one job) as edited in the admin. */
export const chapterSchema = z
  .object({
    numeral: z
      .string()
      .trim()
      .toUpperCase()
      .min(1, "Give it a numeral.")
      .max(8, "Keep it short, e.g. IV.")
      .regex(/^[IVXLCDM]+$/, "Use a Roman numeral, e.g. IV."),
    role: requiredText(80, "What was your role?"),
    company: requiredText(80, "Which company?"),
    location: optionalText(80),
    startMonth: month,
    // Blank = still there ("present").
    endMonth: z.union([z.literal(""), month]),
    summary: requiredText(CHAPTER_SUMMARY_MAX, "Write a one-line summary."),
    bullets: z
      .array(z.string().trim().min(1).max(300, "Keep each point under 300 characters."))
      .max(BULLETS_MAX, `Up to ${BULLETS_MAX} points.`),
    stack: stackField,
  })
  .refine((c) => !c.endMonth || c.endMonth >= c.startMonth, {
    path: ["endMonth"],
    message: "The end can't be before the start.",
  })
  .transform(({ startMonth, endMonth, ...rest }) => ({
    ...rest,
    startDate: monthToDate(startMonth),
    endDate: endMonth ? monthToDate(endMonth) : null,
  }));

export type ChapterInput = z.infer<typeof chapterSchema>;

/** Reads the chapter editor's form fields. Bullets arrive as repeated `bullet` fields; blank ones are dropped. */
export function chapterFormValues(formData: FormData) {
  const text = (name: string) => formData.get(name) ?? "";
  return {
    numeral: text("numeral"),
    role: text("role"),
    company: text("company"),
    location: text("location"),
    startMonth: text("startMonth"),
    endMonth: text("endMonth"),
    summary: text("summary"),
    bullets: formData
      .getAll("bullet")
      .map(String)
      .filter((b) => b.trim()),
    stack: text("stack"),
  };
}
