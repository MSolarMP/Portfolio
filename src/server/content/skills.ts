import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { tags } from "@/lib/cache-tags";
import { db } from "@/server/db";

/** Admin: every skill, grouped by the caller, in display order within each category. */
export function listSkills() {
  return db.skill.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, headline: true },
  });
}

/** Public: every skill in display order. Same shape as the admin list, but cached. */
export async function getSkills() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.skills);
  return listSkills();
}
