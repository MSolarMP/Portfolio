import "server-only";
import type { Stat } from "@/lib/schemas/interest";
import { db } from "@/server/db";

/** Admin: every side quest in display order. Uncached, so the Keeper always sees the latest. */
export function listInterests() {
  return db.interest.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      attribute: true,
      status: true,
      featured: true,
      order: true,
      updatedAt: true,
    },
  });
}

/** Admin: one side quest for the editor, or null. */
export async function getInterest(id: string) {
  const row = await db.interest.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      tagline: true,
      attribute: true,
      stats: true,
      status: true,
      featured: true,
      body: true,
      coverId: true,
    },
  });
  if (!row) return null;
  return { ...row, stats: readStats(row.stats) };
}

/** `stats` is a JSON column; keep only well-formed `{ label, value }` entries. */
function readStats(json: unknown): Stat[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((s) =>
    s && typeof s === "object" && typeof s.label === "string" && typeof s.value === "string"
      ? [{ label: s.label, value: s.value }]
      : [],
  );
}
