import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { tags } from "@/lib/cache-tags";
import { db } from "@/server/db";

/** Admin: every block, ordered for the editor. Uncached — the Keeper always sees the latest. */
export function listContentBlocks() {
  return db.contentBlock.findMany({ orderBy: [{ page: "asc" }, { order: "asc" }] });
}

/**
 * Public: one page's TEXT blocks as `key → text`. Cached until the Pages & copy editor
 * saves a block on that page (`updateTag(content:<page>)`). Read keys with `copyReader()`.
 */
export async function getPageCopy(page: string): Promise<Record<string, string>> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.content(page));
  const rows = await db.contentBlock.findMany({
    where: { page, type: "TEXT" },
    select: { key: true, text: true },
  });
  return Object.fromEntries(rows.map((row) => [row.key, row.text ?? ""]));
}
