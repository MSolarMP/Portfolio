import "server-only";
import { db } from "@/db";

/** Contact messages ("ravens"). Prisma queries only. */

export type MessageView = "inbox" | "archived";

/** One tab of the inbox, newest first. Capped: this is a personal site, not a help desk. */
export function findByView(view: MessageView, take: number) {
  return db.message.findMany({
    where: { archivedAt: view === "archived" ? { not: null } : null },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      company: true,
      purpose: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function counts() {
  const [inbox, unread, archived] = await Promise.all([
    db.message.count({ where: { archivedAt: null } }),
    db.message.count({ where: { archivedAt: null, readAt: null } }),
    db.message.count({ where: { archivedAt: { not: null } } }),
  ]);
  return { inbox, unread, archived };
}

export function findById(id: string) {
  return db.message.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      purpose: true,
      body: true,
      readAt: true,
      archivedAt: true,
      createdAt: true,
    },
  });
}

export async function setReadAt(id: string, readAt: Date | null) {
  await db.message.updateMany({ where: { id }, data: { readAt } });
}

export async function setArchivedAt(id: string, archivedAt: Date | null) {
  await db.message.updateMany({
    where: { id },
    // Archiving also counts as reading it.
    data: archivedAt ? { archivedAt, readAt: archivedAt } : { archivedAt: null },
  });
}

/** Idempotent. Delivery log entries stay, unlinked (FK SET NULL). */
export async function remove(id: string) {
  await db.message.deleteMany({ where: { id } });
}
