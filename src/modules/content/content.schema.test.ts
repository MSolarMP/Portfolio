import { describe, expect, it } from "vitest";
import {
  CONTENT_TEXT_MAX,
  contentKeySchema,
  contentRichSchema,
  contentTextSchema,
} from "./content.schema";

describe("contentTextSchema", () => {
  it("trims surrounding whitespace", () => {
    expect(contentTextSchema.parse({ text: "  Matthew  " }).text).toBe("Matthew");
  });

  it("rejects whitespace-only copy", () => {
    const r = contentTextSchema.safeParse({ text: "   " });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["text"]);
  });

  it("rejects copy over the limit", () => {
    const text = "a".repeat(CONTENT_TEXT_MAX + 1);
    expect(contentTextSchema.safeParse({ text }).success).toBe(false);
  });
});

describe("contentRichSchema", () => {
  const doc = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }],
  };

  it("accepts a Tiptap document", () => {
    expect(contentRichSchema.parse({ rich: doc }).rich).toEqual(doc);
  });

  it("rejects an empty document", () => {
    const r = contentRichSchema.safeParse({ rich: null });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["rich"]);
  });
});

describe("contentKeySchema", () => {
  it("accepts dotted keys and refuses anything else", () => {
    expect(contentKeySchema.safeParse("home.hero.name").success).toBe(true);
    expect(contentKeySchema.safeParse("home").success).toBe(false);
    expect(contentKeySchema.safeParse("../etc").success).toBe(false);
  });
});
