"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, fromServiceError, invalid, success } from "@/lib/action-state";
import { reorderSchema } from "@/lib/validation/reorder";
import { requireAdmin } from "@/modules/auth";
import { commendationSchema } from "./commendations.schema";
import * as service from "./commendations.service";

/** Controllers for the Commendations editor. */

const LIST = "/admin/commendations";

export async function createCommendationAction(input: unknown): Promise<ActionState> {
  await requireAdmin(`${LIST}/new`);
  const parsed = commendationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id } = await service.createCommendation(parsed.data);
  redirect(`${LIST}/${id}?created=1`);
}

export async function updateCommendationAction(id: string, input: unknown): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);
  const parsed = commendationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await service.updateCommendation(id, parsed.data);
  } catch (err) {
    return fromServiceError(err);
  }
  refresh();
  return success(`Saved ${parsed.data.name}'s commendation.`);
}

export async function deleteCommendationAction(id: string): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);
  await service.deleteCommendation(id);
  redirect(LIST);
}

export async function reorderCommendationsAction(ids: unknown): Promise<ActionState> {
  await requireAdmin(LIST);
  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { status: "error", message: "That order couldn't be read." };
  try {
    await service.reorderCommendations(parsed.data.ids);
  } catch (err) {
    return fromServiceError(err);
  }
  return success("Order saved.");
}
