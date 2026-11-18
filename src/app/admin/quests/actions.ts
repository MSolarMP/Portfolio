"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { type ActionState, invalid, success } from "@/lib/action-state";
import { tags } from "@/lib/cache-tags";
import { type QuestInput, questFormValues, questSchema } from "@/lib/schemas/quest";
import { isSameSet, reorderSchema } from "@/lib/schemas/reorder";
import { requireAdmin } from "@/server/authz";
import { db, jsonOrNull } from "@/server/db";

const LIST = "/admin/quests";

/** Prisma data for the fields the editor owns. Empty sections are stored as NULL. */
function toData(input: QuestInput) {
  const { briefing, problem, constraints, approach, bossFight, outcome, loot, ...rest } = input;
  return {
    ...rest,
    briefing: jsonOrNull(briefing),
    problem: jsonOrNull(problem),
    constraints: jsonOrNull(constraints),
    approach: jsonOrNull(approach),
    bossFight: jsonOrNull(bossFight),
    outcome: jsonOrNull(outcome),
    loot: jsonOrNull(loot),
  };
}

function isUniqueClash(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

function isMissingChapter(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003";
}

const slugTaken: ActionState = {
  status: "error",
  message: "Check the highlighted fields.",
  fieldErrors: { slug: "Another quest already uses this slug." },
};

const chapterGone: ActionState = {
  status: "error",
  message: "Check the highlighted fields.",
  fieldErrors: { chapterId: "That chapter no longer exists. Pick another." },
};

export async function createQuest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin(`${LIST}/new`);

  const parsed = questSchema.safeParse(questFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);

  let id: string;
  try {
    // New quests go to the bottom of the list.
    const last = await db.quest.aggregate({ _max: { order: true } });
    const row = await db.quest.create({
      data: { ...toData(parsed.data), order: (last._max.order ?? -1) + 1 },
      select: { id: true },
    });
    id = row.id;
  } catch (err) {
    if (isUniqueClash(err)) return slugTaken;
    if (isMissingChapter(err)) return chapterGone;
    throw err;
  }

  updateTag(tags.quests);
  redirect(`${LIST}/${id}?created=1`);
}

export async function updateQuest(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);

  const parsed = questSchema.safeParse(questFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);

  const before = await db.quest.findUnique({ where: { id }, select: { slug: true } });
  if (!before) return { status: "error", message: "This quest no longer exists." };

  try {
    await db.quest.update({ where: { id }, data: toData(parsed.data) });
  } catch (err) {
    if (isUniqueClash(err)) return slugTaken;
    if (isMissingChapter(err)) return chapterGone;
    throw err;
  }

  updateTag(tags.quests);
  updateTag(tags.quest(parsed.data.slug));
  // A renamed slug: the old page must stop serving the cached copy too.
  if (before.slug !== parsed.data.slug) updateTag(tags.quest(before.slug));
  return success(`Saved “${parsed.data.title}”.`);
}

export async function deleteQuest(id: string): Promise<ActionState> {
  await requireAdmin(`${LIST}/${id}`);

  // Delete-and-return in one statement; a stale tab or double-click finds nothing and moves on.
  const [gone] = await db.$transaction([
    db.quest.findMany({ where: { id }, select: { slug: true } }),
    db.quest.deleteMany({ where: { id } }),
  ]);
  updateTag(tags.quests);
  if (gone[0]) updateTag(tags.quest(gone[0].slug));
  redirect(LIST);
}

/** Saves a new top-to-bottom order. Ids must be exactly the current set of quests. */
export async function reorderQuests(ids: string[]): Promise<ActionState> {
  await requireAdmin(LIST);

  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { status: "error", message: "That order couldn't be read." };

  const current = await db.quest.findMany({ select: { id: true } });
  if (
    !isSameSet(
      parsed.data.ids,
      current.map((r) => r.id),
    )
  ) {
    return { status: "error", message: "The list changed in another tab. Reload and try again." };
  }

  await db.$transaction(
    parsed.data.ids.map((id, order) => db.quest.update({ where: { id }, data: { order } })),
  );
  updateTag(tags.quests);
  return success("Order saved.");
}
