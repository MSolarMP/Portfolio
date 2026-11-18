"use server";

import { type ActionState, invalid, success } from "@/lib/action-state";
import { requireAdmin } from "@/modules/auth";
import { settingsUpdateSchema } from "./settings.schema";
import * as service from "./settings.service";

/** Controller for the Settings page. */
export async function saveSettingsAction(input: unknown): Promise<ActionState> {
  await requireAdmin("/admin/settings");
  const parsed = settingsUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await service.saveSettings(parsed.data);
  return success("Settings saved.");
}
