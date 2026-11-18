import { describe, expect, it } from "vitest";
import { skillSchema, skillUpdateSchema } from "./skills.schema";

function parse(entries: Record<string, unknown>) {
  return skillSchema.safeParse({ headline: false, ...entries });
}

describe("skillSchema", () => {
  it("trims the name", () => {
    expect(parse({ name: "  Next.js ", category: "frontend", headline: true }).data).toEqual({
      name: "Next.js",
      category: "frontend",
      headline: true,
    });
  });

  it("requires a name", () => {
    expect(parse({ name: "  ", category: "frontend" }).error?.issues[0]?.path).toEqual(["name"]);
  });

  it("only accepts known categories", () => {
    expect(parse({ name: "Rust", category: "systems" }).error?.issues[0]?.path).toEqual([
      "category",
    ]);
    expect(parse({ name: "Rust" }).success).toBe(false);
  });

  it("refuses unknown fields", () => {
    expect(parse({ name: "Go", category: "backend", order: 2 }).success).toBe(false);
  });
});

describe("skillUpdateSchema", () => {
  it("accepts a partial update", () => {
    expect(skillUpdateSchema.parse({ headline: true })).toEqual({ headline: true });
  });
});
