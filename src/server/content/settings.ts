import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { tags } from "@/lib/cache-tags";
import { readSettings, SETTING_DEFAULTS } from "@/lib/schemas/settings";
import { db } from "@/server/db";

/** Admin: the current settings, typed, with defaults for anything not saved yet. */
export async function getSettings() {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: Object.keys(SETTING_DEFAULTS) } },
    select: { key: true, value: true },
  });
  return readSettings(rows);
}

/** Public: the same settings, cached until the Settings page saves. None of them are private. */
export async function getPublicSettings() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.settings);
  return getSettings();
}
