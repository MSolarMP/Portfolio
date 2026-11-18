"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, invalid, success } from "@/lib/action-state";
import { tags } from "@/lib/cache-tags";
import { chapterFormValues, chapterSchema } from "@/lib/schemas/chapter";
import { isSameSet, reorderSchema } from "@/lib/schemas/reorder";
import { requireAdmin } from "@/server/authz";
import { db } from "@/server/db";

const LIST = "/admin/chronicle";

/** Quest pages show their chapter, so a chapter change refreshes both. */
function refresh() {
  updateTag(tags.chronicle);
  updateTag(tags.quests);
}

export async function createChapter(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin(`${LIST}/new`);

  const parsed = chapterSchema.safeParse(chapterFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);

  // New chapters go to the top: the Chronicle reads newest first.
  const { id } = await db.$transaction(async (tx) => {
    await tx.chapter.updateMany({ data: { order: { increment: 1 } } });
    return tx.chapter.create({ data: { ...parsed.data, order: 0 }, select: { id: true } });
  });

  refresh();
  redirect(`${LIST}/${id}?created=1`);
}

export async function updateChapter(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);

  const parsed = chapterSchema.safeParse(chapterFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);

  const { count } = await db.chapter.updateMany({ where: { id }, data: parsed.data });
  if (count === 0) return { status: "error", message: "This chapter no longer exists." };

  refresh();
  return success(`Saved “${parsed.data.role}, ${parsed.data.company}”.`);
}

export async function deleteChapter(id: string): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);

  // Linked quests stay; their chapter link is cleared by the FK (ON DELETE SET NULL).
  await db.chapter.deleteMany({ where: { id } });
  refresh();
  redirect(LIST);
}

/** Saves a new top-to-bottom order. Ids must be exactly the current set of chapters. */
export async function reorderChapters(ids: string[]): Promise<ActionState> {
  await requireAdmin(LIST);

  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { status: "error", message: "That order couldn't be read." };

  const current = await db.chapter.findMany({ select: { id: true } });
  if (
    !isSameSet(
      parsed.data.ids,
      current.map((r) => r.id),
    )
  ) {
    return { status: "error", message: "The list changed in another tab. Reload and try again." };
  }

  await db.$transaction(
    parsed.data.ids.map((id, order) => db.chapter.update({ where: { id }, data: { order } })),
  );
  updateTag(tags.chronicle);
  return success("Order saved.");
}
