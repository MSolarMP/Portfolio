"use server";

import { type ActionState, fromServiceError, invalid, success } from "@/lib/action-state";
import { requireAdmin } from "@/modules/auth";
import { contentKeySchema, contentRichSchema, contentTextSchema } from "./content.schema";
import * as service from "./content.service";

/** Controllers for the Pages & copy editor: one small form per block. */

const PAGE = "/admin/pages";
const unknownBlock: ActionState = { status: "error", message: "Unknown copy block." };

export async function updateContentTextAction(key: string, input: unknown): Promise<ActionState> {
  await requireAdmin(PAGE);
  if (!contentKeySchema.safeParse(key).success) return unknownBlock;
  const parsed = contentTextSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { label } = await service.updateContentText(key, parsed.data.text);
    return success(`Saved “${label}”.`);
  } catch (err) {
    return fromServiceError(err);
  }
}

export async function updateContentRichAction(key: string, input: unknown): Promise<ActionState> {
  await requireAdmin(PAGE);
  if (!contentKeySchema.safeParse(key).success) return unknownBlock;
  const parsed = contentRichSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const rich = parsed.data.rich;
  if (!rich) return { status: "error", message: "Copy can't be empty." }; // the schema refuses null
  try {
    const { label } = await service.updateContentRich(key, rich);
    return success(`Saved “${label}”.`);
  } catch (err) {
    return fromServiceError(err);
  }
}
