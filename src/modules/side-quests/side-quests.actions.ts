"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { type ActionState, fromServiceError, invalid, success } from "@/lib/action-state";
import { reorderSchema } from "@/lib/validation/reorder";
import { requireAdmin } from "@/modules/auth";
import { sideQuestCreateSchema, sideQuestUpdateSchema } from "./side-quests.schema";
import * as service from "./side-quests.service";

/**
 * Controllers for the admin side-quest forms. Each one: check the Keeper → validate the
 * input with the shared Zod schema → call the service → turn the outcome into form state.
 * No business rules live here.
 */

const LIST = "/admin/side-quests";

export async function createSideQuestAction(input: unknown): Promise<ActionState> {
  await requireAdmin(`${LIST}/new`);
  const parsed = sideQuestCreateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  let id: string;
  try {
    id = (await service.createSideQuest(parsed.data)).id;
  } catch (err) {
    return fromServiceError(err);
  }
  redirect(`${LIST}/${id}?created=1`);
}

export async function updateSideQuestAction(id: string, input: unknown): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);
  const parsed = sideQuestUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const saved = await service.updateSideQuest(id, parsed.data);
    refresh(); // the page heading and status badge are server-rendered
    return success(`Saved “${saved.title}”.`);
  } catch (err) {
    return fromServiceError(err);
  }
}

export async function deleteSideQuestAction(id: string): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);
  await service.deleteSideQuest(id);
  redirect(LIST);
}

export async function reorderSideQuestsAction(ids: unknown): Promise<ActionState> {
  await requireAdmin(LIST);
  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { status: "error", message: "That order couldn't be read." };

  try {
    await service.reorderSideQuests(parsed.data.ids);
    return success("Order saved.");
  } catch (err) {
    return fromServiceError(err);
  }
}
