import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/validation/fields";
import { sideQuestCreateSchema, sideQuestUpdateSchema, STATS_MAX } from "./side-quests.schema";

describe("slugify", () => {
  it("lowercases, strips accents and joins words with single hyphens", () => {
    expect(slugify("  Trail Running & Hiking! ")).toBe("trail-running-hiking");
    expect(slugify("Pokémon Café")).toBe("pokemon-cafe");
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("sideQuestCreateSchema", () => {
  it("trims text and turns blank or null optionals into null", () => {
    const r = sideQuestCreateSchema.parse({
      title: " Photography ",
      slug: "photography",
      tagline: "",
      attribute: null,
      coverId: "",
    });
    expect(r).toMatchObject({
      title: "Photography",
      tagline: null,
      attribute: null,
      coverId: null,
    });
  });

  it("leaves out fields that weren't sent, so the database defaults apply", () => {
    const r = sideQuestCreateSchema.parse({ title: "Games", slug: "games" });
    expect(r).toEqual({ title: "Games", slug: "games" });
  });

  it("requires title and slug", () => {
    const r = sideQuestCreateSchema.safeParse({ tagline: "x" });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["title", "slug"]));
  });

  it("refuses unknown fields", () => {
    expect(sideQuestCreateSchema.safeParse({ title: "A", slug: "a", order: 3 }).success).toBe(
      false,
    );
  });

  it("rejects a bad slug and too many stats", () => {
    const stats = Array.from({ length: STATS_MAX + 1 }, (_, i) => ({ label: `L${i}`, value: "v" }));
    const r = sideQuestCreateSchema.safeParse({ title: "A", slug: "Not A Slug", stats });
    expect(r.error!.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["slug", "stats"]),
    );
  });

  it("cleans rich text and refuses unsafe links", () => {
    const doc = (href: string) => ({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href } }] }],
        },
      ],
    });
    expect(
      sideQuestCreateSchema.safeParse({ title: "A", slug: "a", body: doc("/ok") }).success,
    ).toBe(true);
    expect(
      sideQuestCreateSchema.safeParse({ title: "A", slug: "a", body: doc("javascript:alert(1)") })
        .success,
    ).toBe(false);
  });
});

describe("sideQuestUpdateSchema", () => {
  it("accepts any subset of fields", () => {
    expect(sideQuestUpdateSchema.parse({ featured: true })).toEqual({ featured: true });
    expect(sideQuestUpdateSchema.parse({})).toEqual({});
  });

  it("still validates the fields it gets", () => {
    expect(sideQuestUpdateSchema.safeParse({ title: "  " }).success).toBe(false);
    expect(sideQuestUpdateSchema.safeParse({ status: "LIVE" }).success).toBe(false);
  });
});
