import { z } from "zod";
import { optionalHttpsUrl, optionalText } from "./fields";

/**
 * Site-wide settings. Each one is a row in `SiteSetting` (key → JSON value),
 * so adding a setting needs no migration: add it here and to the form.
 */
export const settingsSchema = z.object({
  /** Shows the "open to work" banner on the site. */
  openToWork: z.boolean(),
  /** What kind of work, e.g. "Full-time · remote or Gqeberha". */
  roleType: optionalText(80),
  githubUrl: optionalHttpsUrl(
    /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9-]+\/?$/i,
    "Use your GitHub profile address (https://github.com/…).",
  ),
  linkedinUrl: optionalHttpsUrl(
    /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s/?#]+\/?$/i,
    "Use your LinkedIn profile address (https://www.linkedin.com/in/…).",
  ),
});

export type Settings = z.infer<typeof settingsSchema>;
type SettingKey = keyof Settings;

export const SETTING_DEFAULTS: Settings = {
  openToWork: false,
  roleType: null,
  githubUrl: null,
  linkedinUrl: null,
};

// What a stored value must look like to be trusted when read back.
const stored = z
  .object({
    openToWork: z.boolean(),
    roleType: z.string().nullable(),
    githubUrl: z.string().nullable(),
    linkedinUrl: z.string().nullable(),
  })
  .partial();

/**
 * Turns `SiteSetting` rows into typed settings. Unknown keys are ignored; a missing
 * or malformed value falls back to its default, so the site never breaks on bad data.
 */
export function readSettings(rows: { key: string; value: unknown }[]): Settings {
  const settings: Settings = { ...SETTING_DEFAULTS };
  for (const { key, value } of rows) {
    if (!(key in SETTING_DEFAULTS)) continue;
    const one = stored.safeParse({ [key]: value });
    if (one.success && one.data[key as SettingKey] !== undefined) {
      Object.assign(settings, { [key]: one.data[key as SettingKey] });
    }
  }
  return settings;
}

export function settingsFormValues(formData: FormData) {
  const text = (name: string) => formData.get(name) ?? "";
  return {
    openToWork: formData.get("openToWork") === "on",
    roleType: text("roleType"),
    githubUrl: text("githubUrl"),
    linkedinUrl: text("linkedinUrl"),
  };
}
