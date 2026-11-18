"use server";

import { refresh } from "next/cache";
import { type ActionState, fromServiceError, invalid, success } from "@/lib/action-state";
import { reorderSchema } from "@/lib/validation/reorder";
import { requireAdmin } from "@/modules/auth";
import { skillSchema, skillUpdateSchema } from "./skills.schema";
import * as service from "./skills.service";

/** Controllers for the Skills page (quick-add, inline rows, per-category reorder). */

const PAGE = "/admin/skills";

export async function createSkillAction(input: unknown): Promise<ActionState> {
  await requireAdmin(PAGE);
  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await service.createSkill(parsed.data);
  } catch (err) {
    return fromServiceError(err);
  }
  refresh(); // skills live on one page, so re-render it
  return success(`Added “${parsed.data.name}”.`);
}

export async function updateSkillAction(id: string, input: unknown): Promise<ActionState> {
  await requireAdmin(PAGE);
  const parsed = skillUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await service.updateSkill(id, parsed.data);
  } catch (err) {
    return fromServiceError(err);
  }
  refresh();
  return success("Saved.");
}

export async function deleteSkillAction(id: string): Promise<ActionState> {
  await requireAdmin(PAGE);
  await service.deleteSkill(id);
  refresh();
  return success("Deleted.");
}

export async function reorderSkillsAction(category: string, ids: unknown): Promise<ActionState> {
  await requireAdmin(PAGE);
  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { status: "error", message: "That order couldn't be read." };
  try {
    await service.reorderSkills(category, parsed.data.ids);
  } catch (err) {
    return fromServiceError(err);
  }
  return success("Order saved."); // no refresh: the table already shows the new order
}
