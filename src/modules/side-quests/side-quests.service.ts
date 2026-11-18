import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { tags } from "@/lib/cache-tags";
import { readRichDoc } from "@/lib/rich-text";
import type { SideQuestCreate, SideQuestUpdate, Stat } from "./side-quests.schema";
import { isSameSet } from "@/lib/validation/reorder";
import { mediaExists, toPublicImage } from "@/modules/media";
import * as repo from "./side-quests.repository";
import { invalidate } from "@/lib/cache";
import { ConflictError, DuplicateError, NotFoundError, ValidationError } from "@/lib/errors";

/**
 * Side quests: the business rules. Called by the controllers (server actions for the admin
 * forms, REST route handlers for external clients) and by server-rendered pages.
 * Throws domain errors from `@/lib/errors`; knows nothing about HTTP, forms or Prisma.
 */

const RESOURCE = "Side quest";

/** `stats` is a JSON column; keep only well-formed `{ label, value }` entries. */
function readStats(json: unknown): Stat[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((s) =>
    s && typeof s === "object" && typeof s.label === "string" && typeof s.value === "string"
      ? [{ label: s.label, value: s.value }]
      : [],
  );
}

type AdminRow = NonNullable<Awaited<ReturnType<typeof repo.findById>>>;
type PublicRow = Awaited<ReturnType<typeof repo.findPublished>>[number];

/** The Keeper's view: every field, including drafts. */
function toAdmin(row: AdminRow) {
  return { ...row, stats: readStats(row.stats), body: readRichDoc(row.body) };
}
export type SideQuestAdmin = ReturnType<typeof toAdmin>;

/** What anyone can see: published fields only, with the cover as ready-to-use image URLs. */
function toPublic({ cover, stats, body, ...row }: PublicRow) {
  return { ...row, stats: readStats(stats), body: readRichDoc(body), image: toPublicImage(cover) };
}
export type SideQuestPublic = ReturnType<typeof toPublic>;

// ── Reads ────────────────────────────────────────────────────

/** Admin: every side quest in display order. Uncached, so the Keeper always sees the latest. */
export async function listSideQuests() {
  return (await repo.findAll()).map(toAdmin);
}

/** Admin: one side quest. Throws NotFoundError. */
export async function getSideQuest(id: string) {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError(RESOURCE);
  return toAdmin(row);
}

/** Public: published side quests in display order. Cached until a side quest or image changes. */
export async function listPublishedSideQuests() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.interests, tags.media);
  return (await repo.findPublished()).map(toPublic);
}

/** Public: one published side quest. Throws NotFoundError for drafts and missing ids. */
export async function getPublishedSideQuest(id: string) {
  const row = await repo.findPublishedById(id);
  if (!row) throw new NotFoundError(RESOURCE);
  return toPublic(row);
}

/** Admin overview: how many side quests, and how many are drafts. */
export function countSideQuests() {
  return repo.counts();
}

// ── Writes ───────────────────────────────────────────────────

async function checkCover(coverId: string | null | undefined) {
  if (coverId && !(await mediaExists(coverId))) {
    throw new ValidationError({ coverId: "That image is no longer in the vault. Pick another." });
  }
}

function slugTaken(err: unknown): never {
  if (err instanceof DuplicateError) {
    throw new ConflictError("That slug is taken.", "slug_taken", {
      slug: "Another side quest already uses this slug.",
    });
  }
  throw err;
}

/** New side quests go to the bottom of the list. */
export async function createSideQuest(input: SideQuestCreate) {
  await checkCover(input.coverId);
  const row = await repo.create(input, await repo.nextOrder()).catch(slugTaken);
  invalidate(tags.interests);
  return toAdmin(row);
}

/** Partial update. Throws NotFoundError, ConflictError (slug), ValidationError (cover). */
export async function updateSideQuest(id: string, input: SideQuestUpdate) {
  await checkCover(input.coverId);
  const row = await repo.update(id, input).catch(slugTaken);
  if (!row) throw new NotFoundError(RESOURCE);
  invalidate(tags.interests);
  return toAdmin(row);
}

/** Idempotent: deleting a side quest that's already gone succeeds. The cover stays in the vault. */
export async function deleteSideQuest(id: string) {
  await repo.remove(id);
  invalidate(tags.interests);
}

/** Replaces the display order. `ids` must be exactly the current set, or it's a stale list. */
export async function reorderSideQuests(ids: string[]) {
  if (!isSameSet(ids, await repo.allIds())) {
    throw new ConflictError(
      "The list changed in another tab. Reload and try again.",
      "stale_order",
    );
  }
  await repo.setOrder(ids);
  invalidate(tags.interests);
}
