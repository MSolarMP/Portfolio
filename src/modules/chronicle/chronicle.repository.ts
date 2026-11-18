import "server-only";
import { db } from "@/db";
import type { ChapterInput } from "./chronicle.schema";

/** Chronicle chapters (`Chapter` rows). Prisma queries only. */

const displayOrder = [{ order: "asc" as const }, { startDate: "desc" as const }];

export function findAll() {
  return db.chapter.findMany({
    orderBy: displayOrder,
    select: {
      id: true,
      numeral: true,
      role: true,
      company: true,
      startDate: true,
      endDate: true,
      _count: { select: { quests: true } },
    },
  });
}

export function findById(id: string) {
  return db.chapter.findUnique({
    where: { id },
    include: { _count: { select: { quests: true } } },
  });
}

export function findPublic() {
  return db.chapter.findMany({
    orderBy: displayOrder,
    select: {
      id: true,
      numeral: true,
      role: true,
      company: true,
      location: true,
      startDate: true,
      endDate: true,
      summary: true,
      bullets: true,
      stack: true,
    },
  });
}

export function findOptions() {
  return db.chapter.findMany({
    orderBy: { startDate: "desc" },
    select: { id: true, numeral: true, role: true, company: true },
  });
}

export function findEarliestStart() {
  return db.chapter.findFirst({ orderBy: { startDate: "asc" }, select: { startDate: true } });
}

/** Puts the new chapter at the top (order 0) and shifts the rest down, in one transaction. */
export function createAtTop(input: ChapterInput) {
  return db.$transaction(async (tx) => {
    await tx.chapter.updateMany({ data: { order: { increment: 1 } } });
    return tx.chapter.create({ data: { ...input, order: 0 }, select: { id: true } });
  });
}

/** Returns false when the row doesn't exist. */
export async function update(id: string, input: ChapterInput) {
  const { count } = await db.chapter.updateMany({ where: { id }, data: input });
  return count > 0;
}

/** Idempotent. Linked quests stay; their chapter link is cleared by the FK (SET NULL). */
export async function remove(id: string) {
  await db.chapter.deleteMany({ where: { id } });
}

export async function allIds() {
  return (await db.chapter.findMany({ select: { id: true } })).map((r) => r.id);
}

export async function setOrder(ids: string[]) {
  await db.$transaction(
    ids.map((id, order) => db.chapter.update({ where: { id }, data: { order } })),
  );
}

export async function exists(id: string) {
  return (await db.chapter.count({ where: { id } })) > 0;
}
