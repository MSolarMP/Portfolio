import { describe, expect, it } from "vitest";
import { interestFormValues, interestSchema, slugify, STATS_MAX } from "./interest";

function form(entries: [string, string][]) {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
}

const valid = [
  ["title", " Photography "],
  ["slug", "photography"],
  ["tagline", ""],
  ["attribute", "Perception"],
  ["status", "DRAFT"],
] as [string, string][];

describe("slugify", () => {
  it("lowercases, strips accents and joins words with single hyphens", () => {
    expect(slugify("  Trail Running & Hiking! ")).toBe("trail-running-hiking");
    expect(slugify("Pokémon Café")).toBe("pokemon-cafe");
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("interestFormValues + interestSchema", () => {
  it("trims text, turns blank optionals into null and reads the featured checkbox", () => {
    const r = interestSchema.parse(interestFormValues(form([...valid, ["featured", "on"]])));
    expect(r.title).toBe("Photography");
    expect(r.tagline).toBeNull();
    expect(r.featured).toBe(true);
    expect(r.stats).toEqual([]);
  });

  it("treats a missing checkbox as not featured", () => {
    expect(interestSchema.parse(interestFormValues(form(valid))).featured).toBe(false);
  });

  it("pairs stat labels with values and drops fully blank rows", () => {
    const fd = form([
      ...valid,
      ["statLabel", "Shots taken"],
      ["statValue", "12k"],
      ["statLabel", " "],
      ["statValue", ""],
    ]);
    expect(interestSchema.parse(interestFormValues(fd)).stats).toEqual([
      { label: "Shots taken", value: "12k" },
    ]);
  });

  it("rejects a half-filled stat", () => {
    const fd = form([...valid, ["statLabel", "Races"], ["statValue", ""]]);
    const r = interestSchema.safeParse(interestFormValues(fd));
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path[0]).toBe("stats");
  });

  it(`allows at most ${STATS_MAX} stats`, () => {
    const rows = Array.from({ length: STATS_MAX + 1 }, (_, i): [string, string][] => [
      ["statLabel", `s${i}`],
      ["statValue", "1"],
    ]).flat();
    expect(interestSchema.safeParse(interestFormValues(form([...valid, ...rows]))).success).toBe(
      false,
    );
  });

  it.each(["Photography", "photo--graphy", "-photo", "photo_graphy", ""])(
    "rejects the slug %j",
    (slug) => {
      const fd = form([...valid.filter(([k]) => k !== "slug"), ["slug", slug]]);
      expect(interestSchema.safeParse(interestFormValues(fd)).success).toBe(false);
    },
  );

  it("rejects an unknown status", () => {
    const fd = form([...valid.filter(([k]) => k !== "status"), ["status", "ARCHIVED"]]);
    expect(interestSchema.safeParse(interestFormValues(fd)).success).toBe(false);
  });
});
