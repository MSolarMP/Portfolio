import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { tags } from "@/lib/cache-tags";
import { readRichDoc } from "@/lib/rich-text";
import { QUEST_SECTIONS } from "@/lib/schemas/quest";
import { publicImageSelect, toPublicImage } from "@/server/content/media";
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

/** Public: every published quest marked featured, in display order (the home page shows them all). */
export async function getFeaturedQuests() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.quests, tags.media);
  const rows = await db.quest.findMany({
    where: { status: "PUBLISHED", featured: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
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
  return rows.map(({ diagram, ...quest }) => ({ ...quest, image: toPublicImage(diagram) }));
}
