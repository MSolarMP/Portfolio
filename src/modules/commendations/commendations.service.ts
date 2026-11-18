import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { invalidate } from "@/lib/cache";
import { tags } from "@/lib/cache-tags";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { isSameSet } from "@/lib/validation/reorder";
import * as repo from "./commendations.repository";
import type { CommendationInput } from "./commendations.schema";

/**
 * Commendations: LinkedIn recommendations copied in by hand (LinkedIn's API doesn't
 * expose them), each linking back to the recommender's profile.
 */

const RESOURCE = "Commendation";

export function listCommendations() {
  return repo.findAll();
}

/** Throws NotFoundError. */
export async function getCommendation(id: string) {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError(RESOURCE);
  return row;
}

/** Public: published commendations in display order. Cached until one changes. */
export async function listPublishedCommendations() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.commendations);
  return repo.findPublished();
}

/** New commendations go to the bottom of the list. */
export async function createCommendation(input: CommendationInput) {
  const row = await repo.create(input, await repo.nextOrder());
  invalidate(tags.commendations);
  return row;
}

/** Replaces the commendation's fields. Throws NotFoundError. */
export async function updateCommendation(id: string, input: CommendationInput) {
  if (!(await repo.update(id, input))) throw new NotFoundError(RESOURCE);
  invalidate(tags.commendations);
}

export async function deleteCommendation(id: string) {
  await repo.remove(id);
  invalidate(tags.commendations);
}

/** Replaces the display order. `ids` must be exactly the current set. */
export async function reorderCommendations(ids: string[]) {
  if (!isSameSet(ids, await repo.allIds())) {
    throw new ConflictError(
      "The list changed in another tab. Reload and try again.",
      "stale_order",
    );
  }
  await repo.setOrder(ids);
  invalidate(tags.commendations);
}
