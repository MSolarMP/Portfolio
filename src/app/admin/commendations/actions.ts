"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, invalid, success } from "@/lib/action-state";
import { tags } from "@/lib/cache-tags";
import { commendationFormValues, commendationSchema } from "@/lib/schemas/commendation";
import { isSameSet, reorderSchema } from "@/lib/schemas/reorder";
import { requireAdmin } from "@/server/authz";
import { db } from "@/server/db";

const LIST = "/admin/commendations";

export async function createCommendation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin(`${LIST}/new`);

  const parsed = commendationSchema.safeParse(commendationFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);

  // New commendations go to the bottom of the list.
  const last = await db.commendation.aggregate({ _max: { order: true } });
  const { id } = await db.commendation.create({
    data: { ...parsed.data, order: (last._max.order ?? -1) + 1 },
    select: { id: true },
  });

  updateTag(tags.commendations);
  redirect(`${LIST}/${id}?created=1`);
}

export async function updateCommendation(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);

  const parsed = commendationSchema.safeParse(commendationFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);

  const { count } = await db.commendation.updateMany({ where: { id }, data: parsed.data });
  if (count === 0) return { status: "error", message: "This commendation no longer exists." };

  updateTag(tags.commendations);
  return success(`Saved ${parsed.data.name}'s commendation.`);
}

export async function deleteCommendation(id: string): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);
  await db.commendation.deleteMany({ where: { id } });
  updateTag(tags.commendations);
  redirect(LIST);
}

/** Saves a new top-to-bottom order. Ids must be exactly the current set of commendations. */
export async function reorderCommendations(ids: string[]): Promise<ActionState> {
  await requireAdmin(LIST);

  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { status: "error", message: "That order couldn't be read." };

  const current = await db.commendation.findMany({ select: { id: true } });
  if (
    !isSameSet(
      parsed.data.ids,
      current.map((r) => r.id),
    )
  ) {
    return { status: "error", message: "The list changed in another tab. Reload and try again." };
  }

  await db.$transaction(
    parsed.data.ids.map((id, order) => db.commendation.update({ where: { id }, data: { order } })),
  );
  updateTag(tags.commendations);
  return success("Order saved.");
}
