import "server-only";
import type { RichDoc } from "@/lib/rich-text";
import type { Stat } from "./side-quests.schema";
import { db, jsonOrNull } from "@/db";
import { publicImageSelect } from "@/modules/media";
import { translatePrismaError } from "@/db/prisma-errors";

/**
 * Side quests (`Interest` rows). Prisma queries only: no rules, no caching, no HTTP.
 * Callers pass already-validated data.
 */

export type InterestWrite = {
  title?: string;
  slug?: string;
  tagline?: string | null;
  attribute?: string | null;
  body?: RichDoc | null;
  coverId?: string | null;
  stats?: Stat[];
  status?: "DRAFT" | "PUBLISHED";
  featured?: boolean;
};

/** JSON columns need SQL NULL rather than `null`; empty stats are stored as NULL. */
function toData(input: InterestWrite) {
  const { body, stats, ...rest } = input;
  return {
    ...rest,
    ...(body !== undefined && { body: jsonOrNull(body) }),
    ...(stats !== undefined && { stats: jsonOrNull(stats.length ? stats : null) }),
  };
}

const adminSelect = {
  id: true,
  title: true,
  slug: true,
  tagline: true,
  attribute: true,
  body: true,
  coverId: true,
  stats: true,
  status: true,
  featured: true,
  order: true,
  createdAt: true,
  updatedAt: true,
} as const;

const publicSelect = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  attribute: true,
  stats: true,
  featured: true,
  body: true,
  cover: { select: publicImageSelect },
} as const;

const displayOrder = [{ order: "asc" as const }, { createdAt: "asc" as const }];

export function findAll() {
  return db.interest.findMany({ orderBy: displayOrder, select: adminSelect });
}

export function findById(id: string) {
  return db.interest.findUnique({ where: { id }, select: adminSelect });
}

export function findPublished() {
  return db.interest.findMany({
    where: { status: "PUBLISHED" },
    orderBy: displayOrder,
    select: publicSelect,
  });
}

export function findPublishedById(id: string) {
  return db.interest.findFirst({ where: { id, status: "PUBLISHED" }, select: publicSelect });
}

export async function counts() {
  const [total, drafts] = await Promise.all([
    db.interest.count(),
    db.interest.count({ where: { status: "DRAFT" } }),
  ]);
  return { total, drafts };
}

/** The order value that puts a new row at the bottom of the list. */
export async function nextOrder() {
  const last = await db.interest.aggregate({ _max: { order: true } });
  return (last._max.order ?? -1) + 1;
}

export async function create(
  input: InterestWrite & { title: string; slug: string },
  order: number,
) {
  try {
    return await db.interest.create({
      data: { ...toData(input), title: input.title, slug: input.slug, order },
      select: adminSelect,
    });
  } catch (err) {
    translatePrismaError(err);
  }
}

/** Returns null when the row doesn't exist. */
export async function update(id: string, input: InterestWrite) {
  try {
    const { count } = await db.interest.updateMany({ where: { id }, data: toData(input) });
    return count === 0 ? null : findById(id);
  } catch (err) {
    translatePrismaError(err);
  }
}

/** deleteMany so deleting a missing row is a no-op (DELETE is idempotent). */
export async function remove(id: string) {
  await db.interest.deleteMany({ where: { id } });
}

export async function allIds() {
  return (await db.interest.findMany({ select: { id: true } })).map((r) => r.id);
}

/** Writes `order = index` for each id, in one transaction. */
export async function setOrder(ids: string[]) {
  await db.$transaction(
    ids.map((id, order) => db.interest.update({ where: { id }, data: { order } })),
  );
}
