import "server-only";
import { db } from "@/server/db";

/** Admin: every block, ordered for the editor. Uncached — the Keeper always sees the latest. */
export function listContentBlocks() {
  return db.contentBlock.findMany({ orderBy: [{ page: "asc" }, { order: "asc" }] });
}
