import { describe, expect, it } from "vitest";
import { parseStack, STACK_MAX } from "./fields";
import { questFormValues, questSchema } from "./quest";

const base: Record<string, string> = {
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
  status: "DRAFT",
};

function form(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...base, ...overrides })) fd.append(k, v);
  return fd;
}

const parse = (overrides?: Record<string, string>) =>
  questSchema.safeParse(questFormValues(form(overrides)));

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

  it("parses a section's editor JSON", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }],
    };
    expect(parse({ problem: JSON.stringify(doc) }).data?.problem).toEqual(doc);
  });

  it("puts a bad section's error on that section", () => {
    const bad = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:x" } }] },
          ],
        },
      ],
    });
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
