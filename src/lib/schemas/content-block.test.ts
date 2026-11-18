import { describe, expect, it } from "vitest";
import { CONTENT_TEXT_MAX, contentBlockTextSchema } from "./content-block";

describe("contentBlockTextSchema", () => {
  it("trims surrounding whitespace", () => {
    const r = contentBlockTextSchema.parse({ key: "home.hero.name", text: "  Matthew  " });
    expect(r.text).toBe("Matthew");
  });

  it("rejects whitespace-only copy", () => {
    const r = contentBlockTextSchema.safeParse({ key: "home.hero.name", text: "   " });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["text"]);
  });

  it("rejects copy over the limit", () => {
    const text = "a".repeat(CONTENT_TEXT_MAX + 1);
    expect(contentBlockTextSchema.safeParse({ key: "k", text }).success).toBe(false);
  });

  it("requires a key", () => {
    expect(contentBlockTextSchema.safeParse({ key: "", text: "x" }).success).toBe(false);
  });
});
