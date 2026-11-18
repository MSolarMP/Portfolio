"use server";

import { updateTag } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { type ActionState, invalid, success } from "@/lib/action-state";
import { tags } from "@/lib/cache-tags";
import { type Settings, settingsFormValues, settingsSchema } from "@/lib/schemas/settings";
import { requireAdmin } from "@/server/authz";
import { db } from "@/server/db";

/** "Not set" is stored as JSON null (the column itself can't be NULL). */
const toJson = (value: Settings[keyof Settings]) => (value === null ? Prisma.JsonNull : value);

/** Saves every setting at once (one row per key), then refreshes the public pages that use them. */
export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin("/admin/settings");

  const parsed = settingsSchema.safeParse(settingsFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);

  await db.$transaction(
    Object.entries(parsed.data).map(([key, value]) =>
      db.siteSetting.upsert({
        where: { key },
        create: { key, value: toJson(value) },
        update: { value: toJson(value) },
      }),
    ),
  );

  updateTag(tags.settings);
  return success("Settings saved.");
}
