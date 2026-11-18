import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { invalidate } from "@/lib/cache";
import { tags } from "@/lib/cache-tags";
import * as repo from "./settings.repository";
import { readSettings, SETTING_DEFAULTS, type Settings } from "./settings.schema";

/** Site-wide settings: availability and profile links. None of them are private. */

/** Admin: the current settings, typed, with defaults for anything not saved yet. */
export async function getSettings() {
  return readSettings(await repo.findByKeys(Object.keys(SETTING_DEFAULTS)));
}

/** Public: the same settings, cached until they're saved. */
export async function getPublicSettings() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.settings);
  return getSettings();
}

/** Saves the given settings (others keep their value) and refreshes the pages that show them. */
export async function saveSettings(values: Partial<Settings>) {
  await repo.upsertMany(values);
  invalidate(tags.settings);
}
