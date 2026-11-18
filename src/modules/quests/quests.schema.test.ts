import { describe, expect, it } from "vitest";
import { parseStack, STACK_MAX } from "@/lib/validation/fields";
import { questSchema } from "./quests.schema";

const base: Record<string, unknown> = {
  title: " The Great Migration ",
  slug: "the-great-migration",
  kind: "CLIENT",
  rarity: "LEGENDARY",
  client: "",
  role: "Lead",
  summary: "Replaced a legacy desktop app.",
  stack: "",
  repoUrl: "",
  liveUrl: "",
  chapterId: "",
  diagramId: null,
  status: "DRAFT",
  featured: false,
};

const parse = (overrides: Record<string, unknown> = {}) =>
  questSchema.safeParse({ ...base, ...overrides });

describe("parseStack", () => {
  it("splits on commas, trims, collapses spaces and de-dupes ignoring case", () => {
    expect(parseStack("Next.js, Tailwind   CSS ,, next.js ,Prisma")).toEqual([
      "Next.js",
      "Tailwind CSS",
      "Prisma",
    ]);
    expect(parseStack("  ")).toEqual([]);
  });
});

describe("questSchema", () => {
  it("accepts a minimal quest; blank optionals and empty sections become null", () => {
    const r = parse();
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({
      title: "The Great Migration",
      client: null,
      chapterId: null,
      repoUrl: null,
      stack: [],
      briefing: null,
      loot: null,
      featured: false,
    });
  });

  it("keeps a section's Tiptap document", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }],
    };
    expect(parse({ problem: doc }).data?.problem).toEqual(doc);
  });

  it("puts a bad section's error on that section", () => {
    const bad = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:x" } }] },
          ],
        },
      ],
    };
    expect(parse({ approach: bad }).error?.issues[0]?.path).toEqual(["approach"]);
  });

  it("requires a summary", () => {
    expect(parse({ summary: "  " }).error?.issues[0]?.path).toEqual(["summary"]);
  });

  it.each(["http://example.com", "github.com/x", "javascript:alert(1)", "https://nodot"])(
    "rejects the link %s",
    (url) => expect(parse({ repoUrl: url }).success).toBe(false),
  );

  it("accepts https links", () => {
    expect(parse({ liveUrl: "https://mattcreates.co.za" }).data?.liveUrl).toBe(
      "https://mattcreates.co.za",
    );
  });

  it(`allows at most ${STACK_MAX} technologies`, () => {
    const stack = Array.from({ length: STACK_MAX + 1 }, (_, i) => `t${i}`).join(",");
    expect(parse({ stack }).success).toBe(false);
  });

  it("rejects an unknown rarity or kind", () => {
    expect(parse({ rarity: "COMMON" }).success).toBe(false);
    expect(parse({ kind: "SECRET" }).success).toBe(false);
  });
});

describe("diagramId", () => {
  it("is null when no diagram is picked and the id when one is", () => {
    expect(parse().data?.diagramId).toBeNull();
    expect(parse({ diagramId: "abc-123" }).data?.diagramId).toBe("abc-123");
  });
});

describe("questSchema contract", () => {
  it("accepts the stack as an array and refuses unknown fields", () => {
    expect(parse({ stack: ["Next.js", "next.js", "Prisma"] }).data?.stack).toEqual([
      "Next.js",
      "Prisma",
    ]);
    expect(parse({ order: 1 }).success).toBe(false);
  });
});
