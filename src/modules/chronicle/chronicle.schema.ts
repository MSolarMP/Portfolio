import { z } from "zod";
import { optionalText, requiredText, stackField } from "@/lib/validation/fields";

export const BULLETS_MAX = 8;
export const CHAPTER_SUMMARY_MAX = 300;

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** "2026-08" (what <input type="month"> gives) → 1 Aug 2026, as a UTC date for a `date` column. */
export function monthToDate(month: string) {
  return new Date(`${month}-01T00:00:00Z`);
}

/** The reverse, for filling the form: a `date` column → "2026-08". */
export function dateToMonth(date: Date | null) {
  return date ? date.toISOString().slice(0, 7) : "";
}

const month = z.string().trim().regex(MONTH, "Pick a month.");

/**
 * A Chronicle chapter (one job). Months are "YYYY-MM"; an empty or null `endMonth`
 * means "present". Saving replaces the whole chapter, so every field is sent each time.
 */
export const chapterSchema = z
  .strictObject({
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
    endMonth: z.union([z.literal(""), z.null(), month]),
    summary: requiredText(CHAPTER_SUMMARY_MAX, "Write a one-line summary."),
    // Blank points are dropped, so an empty row in the editor doesn't block saving.
    bullets: z
      .array(z.string())
      .transform((items) => items.map((b) => b.trim()).filter(Boolean))
      .pipe(
        z
          .array(z.string().max(300, "Keep each point under 300 characters."))
          .max(BULLETS_MAX, `Up to ${BULLETS_MAX} points.`),
      ),
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

export type ChapterInput = z.output<typeof chapterSchema>;
