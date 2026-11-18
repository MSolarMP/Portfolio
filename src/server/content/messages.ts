import "server-only";
import { db } from "@/server/db";

export type MessageView = "inbox" | "archived";

/** Admin: one tab of the inbox, newest first. Capped; this is a personal site, not a help desk. */
export function listMessages(view: MessageView) {
  return db.message.findMany({
    where: { archivedAt: view === "archived" ? { not: null } : null },
    orderBy: { createdAt: "desc" },
    take: 200,
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

/** Counts for the tabs. */
export async function countMessages() {
  const [inbox, unread, archived] = await Promise.all([
    db.message.count({ where: { archivedAt: null } }),
    db.message.count({ where: { archivedAt: null, readAt: null } }),
    db.message.count({ where: { archivedAt: { not: null } } }),
  ]);
  return { inbox, unread, archived };
}

/** Admin: one message, or null. */
export function getMessage(id: string) {
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
