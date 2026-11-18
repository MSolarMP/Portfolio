"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, fromServiceError, invalid, success } from "@/lib/action-state";
import { reorderSchema } from "@/lib/validation/reorder";
import { requireAdmin } from "@/modules/auth";
import { questSchema } from "./quests.schema";
import * as service from "./quests.service";

/** Controllers for the Quests (case studies) editor. */

const LIST = "/admin/quests";

export async function createQuestAction(input: unknown): Promise<ActionState> {
  await requireAdmin(`${LIST}/new`);
  const parsed = questSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  let id: string;
  try {
    ({ id } = await service.createQuest(parsed.data));
  } catch (err) {
    return fromServiceError(err);
  }
  redirect(`${LIST}/${id}?created=1`);
}

export async function updateQuestAction(id: string, input: unknown): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);
  const parsed = questSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await service.updateQuest(id, parsed.data);
  } catch (err) {
    return fromServiceError(err);
  }
  refresh();
  return success(`Saved “${parsed.data.title}”.`);
}

export async function deleteQuestAction(id: string): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);
  await service.deleteQuest(id);
  redirect(LIST);
}

export async function reorderQuestsAction(ids: unknown): Promise<ActionState> {
  await requireAdmin(LIST);
  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { status: "error", message: "That order couldn't be read." };
  try {
    await service.reorderQuests(parsed.data.ids);
  } catch (err) {
    return fromServiceError(err);
  }
  return success("Order saved.");
}
