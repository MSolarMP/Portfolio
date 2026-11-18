import { describe, expect, it } from "vitest";
import { skillFormValues, skillSchema } from "./skill";

function parse(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return skillSchema.safeParse(skillFormValues(fd));
}

describe("skillSchema", () => {
  it("trims the name and reads the headline checkbox", () => {
    expect(parse({ name: "  Next.js ", category: "frontend", headline: "on" }).data).toEqual({
      name: "Next.js",
      category: "frontend",
      headline: true,
    });
    expect(parse({ name: "Git", category: "cloud" }).data?.headline).toBe(false);
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
});
