"use server";

import { updateTag } from "next/cache";
import { type ActionState, invalid, success } from "@/lib/action-state";
import { tags } from "@/lib/cache-tags";
import { contentBlockRichSchema, contentBlockTextSchema } from "@/lib/schemas/content-block";
import { requireAdmin } from "@/server/authz";
import { db, jsonOrNull } from "@/server/db";

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

export async function updateContentBlockRich(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin("/admin/pages");

  const parsed = contentBlockRichSchema.safeParse({
    key: formData.get("key"),
    rich: formData.get("rich") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);

  const { key, rich } = parsed.data;
  const block = await db.contentBlock.findUnique({
    where: { key },
    select: { page: true, type: true, label: true },
  });
  if (!block) return { status: "error", message: "That block no longer exists." };
  if (block.type !== "RICHTEXT") {
    return { status: "error", message: "Plain-text blocks are edited as plain text." };
  }

  await db.contentBlock.update({ where: { key }, data: { rich: jsonOrNull(rich) } });
  updateTag(tags.content(block.page));
  return success(`Saved “${block.label}”.`);
}
