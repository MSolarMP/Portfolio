import { z } from "zod";
import { optionalHttpsUrl, optionalText, requiredText } from "@/lib/validation/fields";

/** LinkedIn caps recommendations at 3,000 characters. */
export const QUOTE_MAX = 3000;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-11-18" (what <input type="date"> gives) → a UTC date for a `date` column. */
export function dayToDate(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

/** The reverse, for filling the form. */
export function dateToDay(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

/** A LinkedIn recommendation, copied in by hand and linked back to the recommender's profile. */
export const commendationSchema = z
  .strictObject({
    quote: requiredText(QUOTE_MAX, "Paste the recommendation."),
    name: requiredText(80, "Who wrote it?"),
    headline: optionalText(120),
    relationship: optionalText(120),
    givenOn: z
      .string()
      .trim()
      .nullable()
      .transform((v) => v ?? "")
      .refine((v) => !v || (DAY.test(v) && !Number.isNaN(dayToDate(v).getTime())), "Pick a date.")
      .refine((v) => !v || dayToDate(v) <= new Date(), "That date is in the future."),
    profileUrl: optionalHttpsUrl(
      /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/\S+$/i,
      "Use their LinkedIn profile address (https://www.linkedin.com/in/…).",
    ),
    status: z.enum(["DRAFT", "PUBLISHED"], "Pick draft or published."),
    featured: z.boolean(),
  })
  .transform(({ givenOn, ...rest }) => ({
    ...rest,
    givenOn: givenOn ? dayToDate(givenOn) : null,
  }));

export type CommendationInput = z.output<typeof commendationSchema>;
