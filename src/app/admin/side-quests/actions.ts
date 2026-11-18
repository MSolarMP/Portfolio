"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { type ActionState, invalid, success } from "@/lib/action-state";
import { tags } from "@/lib/cache-tags";
import { type InterestInput, interestFormValues, interestSchema } from "@/lib/schemas/interest";
import { isSameSet, reorderSchema } from "@/lib/schemas/reorder";
import { requireAdmin } from "@/server/authz";
import { mediaExists } from "@/server/content/media";
import { db, jsonOrNull } from "@/server/db";

const LIST = "/admin/side-quests";

/** Prisma data for the fields the editor owns. Empty stats and body are stored as NULL. */
function toData(input: InterestInput) {
  return {
    ...input,
    body: jsonOrNull(input.body),
    stats: jsonOrNull(input.stats.length ? input.stats : null),
  };
}

function isSlugTaken(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

const slugTaken: ActionState = {
  status: "error",
  message: "Check the highlighted fields.",
  fieldErrors: { slug: "Another side quest already uses this slug." },
};

export async function createInterest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin(`${LIST}/new`);

  const parsed = interestSchema.safeParse(interestFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.coverId && !(await mediaExists(parsed.data.coverId))) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { coverId: "That image is no longer in the vault. Pick another." },
    };
  }

  let id: string;
  try {
    // New side quests go to the bottom of the list.
    const last = await db.interest.aggregate({ _max: { order: true } });
    const row = await db.interest.create({
      data: { ...toData(parsed.data), order: (last._max.order ?? -1) + 1 },
      select: { id: true },
    });
    id = row.id;
  } catch (err) {
    if (isSlugTaken(err)) return slugTaken;
    throw err;
  }

  updateTag(tags.interests);
  redirect(`${LIST}/${id}?created=1`);
}

export async function updateInterest(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);

  const parsed = interestSchema.safeParse(interestFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.coverId && !(await mediaExists(parsed.data.coverId))) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { coverId: "That image is no longer in the vault. Pick another." },
    };
  }

  try {
    const { count } = await db.interest.updateMany({ where: { id }, data: toData(parsed.data) });
    if (count === 0) return { status: "error", message: "This side quest no longer exists." };
  } catch (err) {
    if (isSlugTaken(err)) return slugTaken;
    throw err;
  }

  updateTag(tags.interests);
  return success(`Saved “${parsed.data.title}”.`);
}

export async function deleteInterest(id: string): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);

  // deleteMany so a double-click or stale tab doesn't throw on a missing row.
  // The cover image stays in the Media vault.
  await db.interest.deleteMany({ where: { id } });
  updateTag(tags.interests);
  redirect(LIST);
}

/** Saves a new top-to-bottom order. Ids must be exactly the current set of side quests. */
export async function reorderInterests(ids: string[]): Promise<ActionState> {
  await requireAdmin(LIST);

  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { status: "error", message: "That order couldn't be read." };

  const current = await db.interest.findMany({ select: { id: true } });
  if (
    !isSameSet(
      parsed.data.ids,
      current.map((r) => r.id),
    )
  ) {
    return { status: "error", message: "The list changed in another tab. Reload and try again." };
  }

  await db.$transaction(
    parsed.data.ids.map((id, order) => db.interest.update({ where: { id }, data: { order } })),
  );
  updateTag(tags.interests);
  return success("Order saved.");
}
