import { z } from "zod";
import { optionalHttpsUrl, optionalText, requiredText } from "./fields";

/** LinkedIn caps recommendations at 3,000 characters. */
export const QUOTE_MAX = 3000;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-11-18" (what <input type="date"> posts) → a UTC date for a `date` column. */
export function dayToDate(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

/** The reverse, for filling the form. */
export function dateToDay(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

/** A LinkedIn recommendation, copied in by hand and linked back to the recommender's profile. */
export const commendationSchema = z
  .object({
    quote: requiredText(QUOTE_MAX, "Paste the recommendation."),
    name: requiredText(80, "Who wrote it?"),
    headline: optionalText(120),
    relationship: optionalText(120),
    givenOn: z
      .string()
      .trim()
      .refine((v) => !v || (DAY.test(v) && !Number.isNaN(dayToDate(v).getTime())), "Pick a date.")
      .refine((v) => !v || dayToDate(v) <= new Date(), "That date is in the future."),
    profileUrl: optionalHttpsUrl(
      /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/\S+$/i,
      "Use their LinkedIn profile address (https://www.linkedin.com/in/…).",
    ),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    featured: z.boolean(),
  })
  .transform(({ givenOn, ...rest }) => ({
    ...rest,
    givenOn: givenOn ? dayToDate(givenOn) : null,
  }));

export type CommendationInput = z.infer<typeof commendationSchema>;

export function commendationFormValues(formData: FormData) {
  const text = (name: string) => formData.get(name) ?? "";
  return {
    quote: text("quote"),
    name: text("name"),
    headline: text("headline"),
    relationship: text("relationship"),
    givenOn: text("givenOn"),
    profileUrl: text("profileUrl"),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
  };
}
