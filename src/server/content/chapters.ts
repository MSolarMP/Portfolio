import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { experience } from "@/lib/experience";
import { tags } from "@/lib/cache-tags";
import { db } from "@/server/db";

/** Admin: every Chronicle chapter in display order, with how many quests link to it. */
export function listChapters() {
  return db.chapter.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
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

/** Admin: one chapter for the editor, or null. */
export function getChapter(id: string) {
  return db.chapter.findUnique({
    where: { id },
    include: { _count: { select: { quests: true } } },
  });
}

/** Public: the Chronicle in display order (newest chapter first). */
export async function getChronicle() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.chronicle);
  return db.chapter.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
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

/**
 * Public: level and mana bar from the first chapter's start date. It depends on today's
 * date, so it's cached for a day rather than until the next edit. Null with no chapters.
 */
export async function getExperience() {
  "use cache";
  cacheLife("days");
  cacheTag(tags.chronicle);
  const first = await db.chapter.findFirst({
    orderBy: { startDate: "asc" },
    select: { startDate: true },
  });
  return first ? experience(first.startDate, new Date()) : null;
}
