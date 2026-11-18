import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { invalidate } from "@/lib/cache";
import { tags } from "@/lib/cache-tags";
import {
  ConflictError,
  DuplicateError,
  MissingReferenceError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { readRichDoc } from "@/lib/rich-text";
import { isSameSet } from "@/lib/validation/reorder";
import { chapterExists } from "@/modules/chronicle";
import { mediaExists, toPublicImage } from "@/modules/media";
import * as repo from "./quests.repository";
import { QUEST_SECTIONS, type QuestInput } from "./quests.schema";

/**
 * Quests: the case studies. A quest can link to a Chronicle chapter and show a diagram
 * from the media vault; both are checked through those modules' public APIs.
 */

const RESOURCE = "Quest";

// ── Reads ────────────────────────────────────────────────────

/** Admin: every quest in display order. */
export function listQuests() {
  return repo.findAll();
}

/** Admin: one quest for the editor, each section read back as clean rich text. Throws NotFoundError. */
export async function getQuest(id: string) {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError(RESOURCE);
  const sections = Object.fromEntries(QUEST_SECTIONS.map((s) => [s.key, readRichDoc(row[s.key])]));
  return { ...row, ...sections };
}

/** Public: every published quest marked featured, in display order. */
export async function getFeaturedQuests() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.quests, tags.media);
  const rows = await repo.findPublishedFeatured();
  return rows.map(({ diagram, ...quest }) => ({ ...quest, image: toPublicImage(diagram) }));
}

/** Admin overview: how many quests, and how many are drafts. */
export function countQuests() {
  return repo.counts();
}

// ── Writes ───────────────────────────────────────────────────

/** The linked chapter and diagram must still exist (another tab may have deleted them). */
async function checkLinks(input: QuestInput) {
  const errors: Record<string, string> = {};
  if (input.chapterId && !(await chapterExists(input.chapterId))) {
    errors.chapterId = "That chapter no longer exists. Pick another.";
  }
  if (input.diagramId && !(await mediaExists(input.diagramId))) {
    errors.diagramId = "That image is no longer in the vault. Pick another.";
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
}

function persistenceError(err: unknown): never {
  if (err instanceof DuplicateError) {
    throw new ConflictError("That slug is taken.", "slug_taken", {
      slug: "Another quest already uses this slug.",
    });
  }
  // The chapter was deleted between the check and the write.
  if (err instanceof MissingReferenceError) {
    throw new ValidationError({ chapterId: "That chapter no longer exists. Pick another." });
  }
  throw err;
}

/** New quests go to the bottom of the list. */
export async function createQuest(input: QuestInput) {
  await checkLinks(input);
  const row = await repo.create(input, await repo.nextOrder()).catch(persistenceError);
  invalidate(tags.quests, tags.quest(input.slug));
  return row;
}

/** Replaces the quest's fields. A renamed slug also refreshes the old page. Throws NotFoundError. */
export async function updateQuest(id: string, input: QuestInput) {
  await checkLinks(input);
  const before = await repo.findSlug(id);
  if (!before) throw new NotFoundError(RESOURCE);
  if (!(await repo.update(id, input).catch(persistenceError))) throw new NotFoundError(RESOURCE);
  invalidate(tags.quests, tags.quest(input.slug));
  if (before.slug !== input.slug) invalidate(tags.quest(before.slug));
}

/** Idempotent. */
export async function deleteQuest(id: string) {
  const slug = await repo.remove(id);
  invalidate(tags.quests);
  if (slug) invalidate(tags.quest(slug));
}

/** Replaces the display order. `ids` must be exactly the current set. */
export async function reorderQuests(ids: string[]) {
  if (!isSameSet(ids, await repo.allIds())) {
    throw new ConflictError(
      "The list changed in another tab. Reload and try again.",
      "stale_order",
    );
  }
  await repo.setOrder(ids);
  invalidate(tags.quests);
}
