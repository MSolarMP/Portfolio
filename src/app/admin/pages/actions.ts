"use server";

import { updateTag } from "next/cache";
import { type ActionState, invalid, success } from "@/lib/action-state";
import { tags } from "@/lib/cache-tags";
import { contentBlockTextSchema } from "@/lib/schemas/content-block";
import { requireAdmin } from "@/server/authz";
import { db } from "@/server/db";

export async function updateContentBlockText(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin("/admin/pages");

  const parsed = contentBlockTextSchema.safeParse({
    key: formData.get("key"),
    text: formData.get("text"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const { key, text } = parsed.data;
  const block = await db.contentBlock.findUnique({
    where: { key },
    select: { page: true, type: true, label: true },
  });
  if (!block) return { status: "error", message: "That block no longer exists." };
  if (block.type !== "TEXT") {
    return { status: "error", message: "Rich-text blocks are edited with the rich-text editor." };
  }

  await db.contentBlock.update({ where: { key }, data: { text } });
  updateTag(tags.content(block.page));
  return success(`Saved “${block.label}”.`);
}
