"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, fromServiceError, invalid, success } from "@/lib/action-state";
import { reorderSchema } from "@/lib/validation/reorder";
import { requireAdmin } from "@/modules/auth";
import { chapterSchema } from "./chronicle.schema";
import * as service from "./chronicle.service";

/** Controllers for the Chronicle editor. */

const LIST = "/admin/chronicle";

export async function createChapterAction(input: unknown): Promise<ActionState> {
  await requireAdmin(`${LIST}/new`);
  const parsed = chapterSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id } = await service.createChapter(parsed.data);
  redirect(`${LIST}/${id}?created=1`);
}

export async function updateChapterAction(id: string, input: unknown): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);
  const parsed = chapterSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await service.updateChapter(id, parsed.data);
  } catch (err) {
    return fromServiceError(err);
  }
  refresh();
  return success(`Saved “${parsed.data.role}, ${parsed.data.company}”.`);
}

export async function deleteChapterAction(id: string): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);
  await service.deleteChapter(id);
  redirect(LIST);
}

export async function reorderChaptersAction(ids: unknown): Promise<ActionState> {
  await requireAdmin(LIST);
  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { status: "error", message: "That order couldn't be read." };
  try {
    await service.reorderChapters(parsed.data.ids);
  } catch (err) {
    return fromServiceError(err);
  }
  return success("Order saved.");
}
