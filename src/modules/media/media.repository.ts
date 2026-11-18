import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/db";

/** Media rows. Prisma queries only: no storage, no image processing, no caching. */

export function findAll() {
  return db.media.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      width: true,
      height: true,
      bytes: true,
      alt: true,
      blurData: true,
      variants: true,
      state: true,
    },
  });
}

/** One image, with the side quests and quests that use it. */
export function findByIdWithUsage(id: string) {
  return db.media.findUnique({
    where: { id },
    include: {
      coverOf: { select: { id: true, title: true } },
      diagramOf: { select: { id: true, title: true } },
    },
  });
}

export function findReadyImages() {
  return db.media.findMany({
    where: { state: "READY", kind: "IMAGE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, filename: true, alt: true, width: true, height: true, variants: true },
  });
}

export async function exists(id: string) {
  return (await db.media.count({ where: { id } })) > 0;
}

export function findFiles(id: string) {
  return db.media.findUnique({ where: { id }, select: { key: true, variants: true } });
}

export function create(data: Prisma.MediaUncheckedCreateInput) {
  return db.media.create({ data, select: { id: true } });
}

/** Returns false when the row doesn't exist. */
export async function updateDetails(
  id: string,
  data: { alt: string | null; caption: string | null },
) {
  const { count } = await db.media.updateMany({ where: { id }, data });
  return count > 0;
}

/** Idempotent. Covers and diagrams pointing at it are cleared by the foreign key (SET NULL). */
export async function remove(id: string) {
  await db.media.deleteMany({ where: { id } });
}
