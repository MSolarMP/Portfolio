"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, success } from "@/lib/action-state";
import { requireAdmin } from "@/modules/auth";
import * as service from "./messages.service";

/** Controllers for the Ravens inbox buttons. Messages aren't public, so there's no cache tag. */

const INBOX = "/admin/messages";

// Arguments to server actions arrive from the browser, so they're checked like form input.
const idField = z.string().min(1).max(100);
const flag = z.boolean();

export async function setMessageReadAction(id: unknown, read: unknown): Promise<ActionState> {
  await requireAdmin(INBOX);
  const isRead = flag.parse(read);
  await service.setMessageRead(idField.parse(id), isRead);
  refresh();
  return success(isRead ? "Marked as read." : "Marked as unread.");
}

export async function setMessageArchivedAction(
  id: unknown,
  archived: unknown,
): Promise<ActionState> {
  await requireAdmin(INBOX);
  const isArchived = flag.parse(archived);
  await service.setMessageArchived(idField.parse(id), isArchived);
  refresh();
  return success(isArchived ? "Archived." : "Moved back to the inbox.");
}

export async function deleteMessageAction(id: unknown): Promise<ActionState> {
  await requireAdmin(INBOX);
  await service.deleteMessage(idField.parse(id));
  redirect(INBOX);
}
