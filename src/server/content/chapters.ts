import "server-only";
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
