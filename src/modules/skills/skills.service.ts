import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { invalidate } from "@/lib/cache";
import { tags } from "@/lib/cache-tags";
import { ConflictError, DuplicateError, NotFoundError } from "@/lib/errors";
import { isSameSet } from "@/lib/validation/reorder";
import * as repo from "./skills.repository";
import type { SkillInput, SkillUpdate } from "./skills.schema";

/** Skills, grouped by category. Each category keeps its own display order. */

const RESOURCE = "Skill";

function duplicateName(err: unknown): never {
  if (err instanceof DuplicateError) {
    throw new ConflictError("That skill already exists.", "duplicate_skill", {
      name: "That skill is already in this category.",
    });
  }
  throw err;
}

/** Admin: every skill, in display order within each category. */
export function listSkills() {
  return repo.findAll();
}

/** Public: the same list, cached until a skill changes. */
export async function getSkills() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.skills);
  return repo.findAll();
}

/** New skills go to the bottom of their category. */
export async function createSkill(input: SkillInput) {
  const row = await repo.create(input, await repo.nextOrder(input.category)).catch(duplicateName);
  invalidate(tags.skills);
  return row;
}

/** Moving to another category puts the skill at the bottom of that list. */
export async function updateSkill(id: string, input: SkillUpdate) {
  const before = await repo.findCategory(id);
  if (!before) throw new NotFoundError(RESOURCE);
  const moved = input.category !== undefined && input.category !== before.category;
  await repo
    .update(id, { ...input, ...(moved && { order: await repo.nextOrder(input.category!) }) })
    .catch(duplicateName);
  invalidate(tags.skills);
}

export async function deleteSkill(id: string) {
  await repo.remove(id);
  invalidate(tags.skills);
}

/** New order for one category. `ids` must be exactly that category's skills. */
export async function reorderSkills(category: string, ids: string[]) {
  if (!isSameSet(ids, await repo.idsInCategory(category))) {
    throw new ConflictError(
      "The list changed in another tab. Reload and try again.",
      "stale_order",
    );
  }
  await repo.setOrder(ids);
  invalidate(tags.skills);
}
