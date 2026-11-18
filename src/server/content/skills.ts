import "server-only";
import { db } from "@/server/db";

/** Admin: every skill, grouped by the caller, in display order within each category. */
export function listSkills() {
  return db.skill.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, headline: true },
  });
}
