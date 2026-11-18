import "server-only";
import { db } from "@/server/db";

/** Admin: every commendation in display order. */
export function listCommendations() {
  return db.commendation.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      headline: true,
      quote: true,
      givenOn: true,
      status: true,
      featured: true,
    },
  });
}

/** Admin: one commendation for the editor, or null. */
export function getCommendation(id: string) {
  return db.commendation.findUnique({ where: { id } });
}
