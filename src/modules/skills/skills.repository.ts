import "server-only";
import { db } from "@/db";
import { translatePrismaError } from "@/db/prisma-errors";
import type { SkillInput, SkillUpdate } from "./skills.schema";

/** Skills (the skill tree). Prisma queries only. */

export function findAll() {
  return db.skill.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, headline: true },
  });
}

export function findCategory(id: string) {
  return db.skill.findUnique({ where: { id }, select: { category: true } });
}

/** The order value that puts a skill at the bottom of `category`. */
export async function nextOrder(category: string) {
  const last = await db.skill.aggregate({ where: { category }, _max: { order: true } });
  return (last._max.order ?? -1) + 1;
}

export async function create(input: SkillInput, order: number) {
  try {
    return await db.skill.create({ data: { ...input, order }, select: { id: true } });
  } catch (err) {
    translatePrismaError(err);
  }
}

export async function update(id: string, input: SkillUpdate & { order?: number }) {
  try {
    await db.skill.update({ where: { id }, data: input });
  } catch (err) {
    translatePrismaError(err);
  }
}

export async function remove(id: string) {
  await db.skill.deleteMany({ where: { id } });
}

export async function idsInCategory(category: string) {
  return (await db.skill.findMany({ where: { category }, select: { id: true } })).map((r) => r.id);
}

export async function setOrder(ids: string[]) {
  await db.$transaction(
    ids.map((id, order) => db.skill.update({ where: { id }, data: { order } })),
  );
}
