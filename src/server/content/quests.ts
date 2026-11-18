import "server-only";
import { readRichDoc } from "@/lib/rich-text";
import { QUEST_SECTIONS } from "@/lib/schemas/quest";
import { db } from "@/server/db";

/** Admin: every quest in display order. Uncached, so the Keeper always sees the latest. */
export function listQuests() {
  return db.quest.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
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

/** Admin: one quest for the editor, with each section read back as clean rich text. */
export async function getQuest(id: string) {
  const row = await db.quest.findUnique({ where: { id } });
  if (!row) return null;
  const sections = Object.fromEntries(QUEST_SECTIONS.map((s) => [s.key, readRichDoc(row[s.key])]));
  return { ...row, ...sections };
}

/** Admin: Chronicle chapters for the "Part of" dropdown, newest first. */
export function listChapterOptions() {
  return db.chapter.findMany({
    orderBy: { startDate: "desc" },
    select: { id: true, numeral: true, role: true, company: true },
  });
}
