import "server-only";
import { db, jsonOrNull } from "@/db";
import { translatePrismaError } from "@/db/prisma-errors";
import { publicImageSelect } from "@/modules/media";
import { QUEST_SECTIONS, type QuestInput, type QuestSection } from "./quests.schema";

/** Quests (case studies). Prisma queries only. */

const displayOrder = [{ order: "asc" as const }, { createdAt: "asc" as const }];

/** JSON columns need SQL NULL; empty sections are stored as NULL. */
function toData(input: QuestInput) {
  const sections = Object.fromEntries(
    QUEST_SECTIONS.map((s) => [s.key, jsonOrNull(input[s.key])]),
  ) as Record<QuestSection, ReturnType<typeof jsonOrNull>>;
  return { ...input, ...sections };
}

export function findAll() {
  return db.quest.findMany({
    orderBy: displayOrder,
    select: {
      id: true,
      title: true,
      slug: true,
      client: true,
      kind: true,
      rarity: true,
      status: true,
      featured: true,
      updatedAt: true,
    },
  });
}

export function findById(id: string) {
  return db.quest.findUnique({ where: { id } });
}

export function findSlug(id: string) {
  return db.quest.findUnique({ where: { id }, select: { slug: true } });
}

export function findPublishedFeatured() {
  return db.quest.findMany({
    where: { status: "PUBLISHED", featured: true },
    orderBy: displayOrder,
    select: {
      slug: true,
      title: true,
      client: true,
      rarity: true,
      summary: true,
      stack: true,
      diagram: { select: publicImageSelect },
    },
  });
}

export async function counts() {
  const [total, drafts] = await Promise.all([
    db.quest.count(),
    db.quest.count({ where: { status: "DRAFT" } }),
  ]);
  return { total, drafts };
}

export async function nextOrder() {
  const last = await db.quest.aggregate({ _max: { order: true } });
  return (last._max.order ?? -1) + 1;
}

export async function create(input: QuestInput, order: number) {
  try {
    return await db.quest.create({ data: { ...toData(input), order }, select: { id: true } });
  } catch (err) {
    translatePrismaError(err);
  }
}

/** Returns false when the row doesn't exist. */
export async function update(id: string, input: QuestInput) {
  try {
    const { count } = await db.quest.updateMany({ where: { id }, data: toData(input) });
    return count > 0;
  } catch (err) {
    translatePrismaError(err);
  }
}

/** Deletes and returns the old slug (null if it was already gone), in one transaction. */
export async function remove(id: string) {
  const [gone] = await db.$transaction([
    db.quest.findMany({ where: { id }, select: { slug: true } }),
    db.quest.deleteMany({ where: { id } }),
  ]);
  return gone[0]?.slug ?? null;
}

export async function allIds() {
  return (await db.quest.findMany({ select: { id: true } })).map((r) => r.id);
}

export async function setOrder(ids: string[]) {
  await db.$transaction(
    ids.map((id, order) => db.quest.update({ where: { id }, data: { order } })),
  );
}
