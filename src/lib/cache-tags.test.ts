import { describe, expect, it } from "vitest";
import { tags } from "./cache-tags";

describe("cache tags", () => {
  it("builds per-page and per-quest tags", () => {
    expect(tags.content("home")).toBe("content:home");
    expect(tags.quest("the-great-migration")).toBe("quest:the-great-migration");
  });

  it("keeps every tag within Next.js's 256 character limit", () => {
    const longSlug = "x".repeat(200);
    expect(tags.quest(longSlug).length).toBeLessThanOrEqual(256);
  });
});
