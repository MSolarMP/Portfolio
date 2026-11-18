import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { tags } from "@/lib/cache-tags";
import { readRichDoc } from "@/lib/rich-text";
import type { Stat } from "@/lib/schemas/interest";
import { publicImageSelect, toPublicImage } from "@/server/content/media";
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
  return { ...row, stats: readStats(row.stats), body: readRichDoc(row.body) };
}

/** Public: published side quests in display order, with cleaned body text and cover image. */
export async function getPublishedInterests() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.interests, tags.media);
  const rows = await db.interest.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      slug: true,
      title: true,
      tagline: true,
      attribute: true,
      stats: true,
      featured: true,
      body: true,
      cover: { select: publicImageSelect },
    },
  });
  return rows.map(({ cover, stats, body, ...interest }) => ({
    ...interest,
    stats: readStats(stats),
    body: readRichDoc(body),
    image: toPublicImage(cover),
  }));
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
