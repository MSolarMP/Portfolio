import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { invalidate } from "@/lib/cache";
import { tags } from "@/lib/cache-tags";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { experience } from "@/lib/experience";
import { isSameSet } from "@/lib/validation/reorder";
import * as repo from "./chronicle.repository";
import type { ChapterInput } from "./chronicle.schema";

/** The Chronicle: one chapter per job, newest first. Quests can link to a chapter. */

const RESOURCE = "Chapter";

/** Quest pages show their chapter, so chapter changes refresh both. */
function invalidateChronicle() {
  invalidate(tags.chronicle, tags.quests);
}

// ── Reads ────────────────────────────────────────────────────

/** Admin: every chapter in display order, with how many quests link to it. */
export function listChapters() {
  return repo.findAll();
}

/** Admin: one chapter for the editor. Throws NotFoundError. */
export async function getChapter(id: string) {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError(RESOURCE);
  return row;
}

/** Admin: the choices for a quest's "Part of" dropdown, newest first. */
export function listChapterOptions() {
  return repo.findOptions();
}

/** For other modules: does this chapter exist? */
export function chapterExists(id: string) {
  return repo.exists(id);
}

/** Public: the Chronicle in display order (newest chapter first). */
export async function getChronicle() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.chronicle);
  return repo.findPublic();
}

/**
 * Public: level and mana bar from the first chapter's start date. It depends on today's
 * date, so it's cached for a day rather than until the next edit. Null with no chapters.
 */
export async function getExperience() {
  "use cache";
  cacheLife("days");
  cacheTag(tags.chronicle);
  const first = await repo.findEarliestStart();
  return first ? experience(first.startDate, new Date()) : null;
}

// ── Writes ───────────────────────────────────────────────────

/** New chapters go to the top: the Chronicle reads newest first. */
export async function createChapter(input: ChapterInput) {
  const row = await repo.createAtTop(input);
  invalidateChronicle();
  return row;
}

/** Replaces the chapter's fields. Throws NotFoundError. */
export async function updateChapter(id: string, input: ChapterInput) {
  if (!(await repo.update(id, input))) throw new NotFoundError(RESOURCE);
  invalidateChronicle();
}

/** Idempotent. Linked quests are kept and unlinked. */
export async function deleteChapter(id: string) {
  await repo.remove(id);
  invalidateChronicle();
}

/** Replaces the display order. `ids` must be exactly the current set of chapters. */
export async function reorderChapters(ids: string[]) {
  if (!isSameSet(ids, await repo.allIds())) {
    throw new ConflictError(
      "The list changed in another tab. Reload and try again.",
      "stale_order",
    );
  }
  await repo.setOrder(ids);
  invalidate(tags.chronicle);
}
