"use server";

import { refresh, updateTag } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { type ActionState, invalid, success } from "@/lib/action-state";
import { tags } from "@/lib/cache-tags";
import { isSameSet, reorderSchema } from "@/lib/schemas/reorder";
import { skillFormValues, skillSchema } from "@/lib/schemas/skill";
import { requireAdmin } from "@/server/authz";
import { db } from "@/server/db";

const PAGE = "/admin/skills";

function isDuplicate(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

const duplicate: ActionState = {
  status: "error",
  message: "Check the highlighted fields.",
  fieldErrors: { name: "That skill is already in this category." },
};

/** Skills live on one page, so every change re-renders it (`refresh`) and the public cache. */
function changed() {
  updateTag(tags.skills);
  refresh();
}

/** Next order number at the bottom of a category. */
async function nextOrder(category: string) {
  const last = await db.skill.aggregate({ where: { category }, _max: { order: true } });
  return (last._max.order ?? -1) + 1;
}

export async function createSkill(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin(PAGE);

  const result = skillSchema.safeParse(skillFormValues(formData));
  if (!result.success) return invalid(result.error);

  try {
    await db.skill.create({
      data: { ...result.data, order: await nextOrder(result.data.category) },
    });
  } catch (err) {
    if (isDuplicate(err)) return duplicate;
    throw err;
  }

  changed();
  return success(`Added “${result.data.name}”.`);
}

export async function updateSkill(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin(PAGE);

  const result = skillSchema.safeParse(skillFormValues(formData));
  if (!result.success) return invalid(result.error);

  const before = await db.skill.findUnique({ where: { id }, select: { category: true } });
  if (!before) return { status: "error", message: "This skill no longer exists." };

  try {
    await db.skill.update({
      where: { id },
      data: {
        ...result.data,
        // Moving to another category puts it at the bottom of that list.
        ...(before.category !== result.data.category && {
          order: await nextOrder(result.data.category),
        }),
      },
    });
  } catch (err) {
    if (isDuplicate(err)) return duplicate;
    throw err;
  }

  changed();
  return success("Saved.");
}

export async function deleteSkill(id: string): Promise<ActionState> {
  await requireAdmin(PAGE);
  await db.skill.deleteMany({ where: { id } });
  changed();
  return success("Deleted.");
}

/** New top-to-bottom order for one category. Ids must be exactly that category's skills. */
export async function reorderSkills(category: string, ids: string[]): Promise<ActionState> {
  await requireAdmin(PAGE);

  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { status: "error", message: "That order couldn't be read." };

  const current = await db.skill.findMany({ where: { category }, select: { id: true } });
  if (
    !isSameSet(
      parsed.data.ids,
      current.map((r) => r.id),
    )
  ) {
    return { status: "error", message: "The list changed in another tab. Reload and try again." };
  }

  await db.$transaction(
    parsed.data.ids.map((id, order) => db.skill.update({ where: { id }, data: { order } })),
  );
  updateTag(tags.skills); // no refresh: the table already shows the new order
  return success("Order saved.");
}
