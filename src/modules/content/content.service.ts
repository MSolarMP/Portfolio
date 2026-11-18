import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { invalidate } from "@/lib/cache";
import { tags } from "@/lib/cache-tags";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { RichDoc } from "@/lib/rich-text";
import * as repo from "./content.repository";

/**
 * Page copy: every word on the public site lives in a ContentBlock, keyed like
 * `home.hero.tagline` and grouped by page. The seed creates the blocks; the admin
 * edits their text. Pages read keys with `copyReader()`.
 */

const RESOURCE = "Copy block";

/** Admin: every block, ordered for the editor. Uncached — the Keeper always sees the latest. */
export function listContentBlocks() {
  return repo.findAll();
}

/** Public: one page's TEXT blocks as `key → text`. Cached until a block on that page is saved. */
export async function getPageCopy(page: string): Promise<Record<string, string>> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.content(page));
  const rows = await repo.findTextByPage(page);
  return Object.fromEntries(rows.map((row) => [row.key, row.text ?? ""]));
}

async function blockOfType(key: string, type: "TEXT" | "RICHTEXT", field: string) {
  const block = await repo.findMeta(key);
  if (!block) throw new NotFoundError(RESOURCE);
  if (block.type !== type) {
    throw new ValidationError({
      [field]:
        type === "TEXT"
          ? "This block is rich text; edit it with the rich-text editor."
          : "This block is plain text; edit it as plain text.",
    });
  }
  return block;
}

/** Saves a plain-text block and refreshes its page. Returns the block's label. */
export async function updateContentText(key: string, text: string) {
  const block = await blockOfType(key, "TEXT", "text");
  await repo.setText(key, text);
  invalidate(tags.content(block.page));
  return { label: block.label };
}

/** Saves a rich-text block and refreshes its page. Returns the block's label. */
export async function updateContentRich(key: string, rich: RichDoc) {
  const block = await blockOfType(key, "RICHTEXT", "rich");
  await repo.setRich(key, rich);
  invalidate(tags.content(block.page));
  return { label: block.label };
}
