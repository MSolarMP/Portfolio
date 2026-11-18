import "server-only";
import { db } from "@/db";
import type { CommendationInput } from "./commendations.schema";

/** Commendations (LinkedIn recommendations). Prisma queries only. */

const displayOrder = [{ order: "asc" as const }, { createdAt: "asc" as const }];

export function findAll() {
  return db.commendation.findMany({
    orderBy: displayOrder,
    select: {
      id: true,
      name: true,
      headline: true,
      quote: true,
      givenOn: true,
      status: true,
      featured: true,
    },
  });
}

export function findById(id: string) {
  return db.commendation.findUnique({ where: { id } });
}

export function findPublished() {
  return db.commendation.findMany({
    where: { status: "PUBLISHED" },
    orderBy: displayOrder,
    select: {
      id: true,
      quote: true,
      name: true,
      headline: true,
      relationship: true,
      givenOn: true,
      profileUrl: true,
      featured: true,
    },
  });
}

export async function nextOrder() {
  const last = await db.commendation.aggregate({ _max: { order: true } });
  return (last._max.order ?? -1) + 1;
}

export function create(input: CommendationInput, order: number) {
  return db.commendation.create({ data: { ...input, order }, select: { id: true } });
}

/** Returns false when the row doesn't exist. */
export async function update(id: string, input: CommendationInput) {
  const { count } = await db.commendation.updateMany({ where: { id }, data: input });
  return count > 0;
}

export async function remove(id: string) {
  await db.commendation.deleteMany({ where: { id } });
}

export async function allIds() {
  return (await db.commendation.findMany({ select: { id: true } })).map((r) => r.id);
}

export async function setOrder(ids: string[]) {
  await db.$transaction(
    ids.map((id, order) => db.commendation.update({ where: { id }, data: { order } })),
  );
}
