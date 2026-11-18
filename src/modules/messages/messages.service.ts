import "server-only";
import { NotFoundError } from "@/lib/errors";
import * as repo from "./messages.repository";

/**
 * The Ravens inbox: messages sent through the contact form. Private to the Keeper,
 * so nothing here is cached. (Sending a message and the email/SMS alerts come in Phase 3.)
 */

export type { MessageView } from "./messages.repository";

const INBOX_LIMIT = 200;

export function listMessages(view: repo.MessageView) {
  return repo.findByView(view, INBOX_LIMIT);
}

/** Counts for the Inbox / Unread / Archived tabs. */
export function countMessages() {
  return repo.counts();
}

/** Throws NotFoundError. */
export async function getMessage(id: string) {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError("Message");
  return row;
}

export function setMessageRead(id: string, read: boolean) {
  return repo.setReadAt(id, read ? new Date() : null);
}

export function setMessageArchived(id: string, archived: boolean) {
  return repo.setArchivedAt(id, archived ? new Date() : null);
}

export function deleteMessage(id: string) {
  return repo.remove(id);
}
