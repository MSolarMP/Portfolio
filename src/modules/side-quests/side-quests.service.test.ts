import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, DuplicateError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  createSideQuest,
  deleteSideQuest,
  getSideQuest,
  reorderSideQuests,
  updateSideQuest,
} from "./side-quests.service";

const repo = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findPublished: vi.fn(),
  findPublishedById: vi.fn(),
  nextOrder: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  allIds: vi.fn(),
  setOrder: vi.fn(),
}));
const media = vi.hoisted(() => ({ mediaExists: vi.fn(), toPublicImage: vi.fn(() => null) }));
const revalidateTag = vi.hoisted(() => vi.fn());

vi.mock("./side-quests.repository", () => repo);
vi.mock("@/modules/media", () => media);
vi.mock("next/cache", () => ({ revalidateTag, cacheLife: () => {}, cacheTag: () => {} }));

const row = {
  id: "sq1",
  title: "Photography",
  slug: "photography",
  tagline: null,
  attribute: null,
  body: null,
  coverId: null,
  stats: [{ label: "Shots", value: "1k" }, { bogus: true }],
  status: "DRAFT",
  featured: false,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  repo.nextOrder.mockResolvedValue(3);
  media.mediaExists.mockResolvedValue(true);
});

describe("side quest service", () => {
  it("creates at the bottom of the list and refreshes the cache", async () => {
    repo.create.mockResolvedValue(row);
    const created = await createSideQuest({ title: "Photography", slug: "photography" });
    expect(repo.create).toHaveBeenCalledWith({ title: "Photography", slug: "photography" }, 3);
    expect(revalidateTag).toHaveBeenCalledWith("interests", { expire: 0 });
    // Malformed stats from the JSON column are dropped on the way out.
    expect(created.stats).toEqual([{ label: "Shots", value: "1k" }]);
  });

  it("refuses a cover image that's no longer in the vault", async () => {
    media.mediaExists.mockResolvedValue(false);
    await expect(
      createSideQuest({ title: "A", slug: "a", coverId: "gone" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("turns a duplicate slug into a 409-style conflict on the slug field", async () => {
    repo.create.mockRejectedValue(new DuplicateError(["slug"]));
    const err = await createSideQuest({ title: "A", slug: "a" }).catch((e) => e);
    expect(err).toBeInstanceOf(ConflictError);
    expect(err).toMatchObject({ code: "slug_taken", errors: { slug: expect.any(String) } });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("404s an update or read of a missing side quest", async () => {
    repo.update.mockResolvedValue(null);
    await expect(updateSideQuest("nope", { featured: true })).rejects.toBeInstanceOf(NotFoundError);
    repo.findById.mockResolvedValue(null);
    await expect(getSideQuest("nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deletes idempotently", async () => {
    await deleteSideQuest("sq1");
    await deleteSideQuest("sq1");
    expect(repo.remove).toHaveBeenCalledTimes(2);
  });

  it("rejects a reorder that doesn't match the current list", async () => {
    repo.allIds.mockResolvedValue(["a", "b", "c"]);
    await expect(reorderSideQuests(["a", "b"])).rejects.toMatchObject({ code: "stale_order" });
    expect(repo.setOrder).not.toHaveBeenCalled();

    await reorderSideQuests(["c", "a", "b"]);
    expect(repo.setOrder).toHaveBeenCalledWith(["c", "a", "b"]);
  });
});
