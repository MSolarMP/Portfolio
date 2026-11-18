"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, success } from "@/lib/action-state";
import { requireAdmin } from "@/server/authz";
import { db } from "@/server/db";

const INBOX = "/admin/messages";

// Arguments to server actions arrive from the browser, so check them like form input.
const idField = z.string().min(1).max(100);

/** Marks a message read (or unread again). Messages aren't public, so there's no cache tag. */
export async function setMessageRead(id: string, read: boolean): Promise<ActionState> {
  await requireAdmin(INBOX);
  const messageId = idField.parse(id);
  await db.message.updateMany({
    where: { id: messageId },
    data: { readAt: read ? new Date() : null },
  });
  refresh();
  return success(read ? "Marked as read." : "Marked as unread.");
}

/** Moves a message to Archived, or back to the Inbox. */
export async function setMessageArchived(id: string, archived: boolean): Promise<ActionState> {
  await requireAdmin(INBOX);
  const messageId = idField.parse(id);
  await db.message.updateMany({
    where: { id: messageId },
    // Archiving also counts as reading it.
    data: archived ? { archivedAt: new Date(), readAt: new Date() } : { archivedAt: null },
  });
  refresh();
  return success(archived ? "Archived." : "Moved back to the inbox.");
}

/** Deletes a message for good. Its delivery log entries stay, unlinked (FK SET NULL). */
export async function deleteMessage(id: string): Promise<ActionState> {
  await requireAdmin(INBOX);
  await db.message.deleteMany({ where: { id: idField.parse(id) } });
  redirect(INBOX);
}
