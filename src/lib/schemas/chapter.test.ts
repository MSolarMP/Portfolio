import { describe, expect, it } from "vitest";
import { BULLETS_MAX, chapterFormValues, chapterSchema, dateToMonth, monthToDate } from "./chapter";

const base: [string, string][] = [
  ["numeral", " iv "],
  ["role", "Software Engineer"],
  ["company", "FantasyGo"],
  ["location", ""],
  ["startMonth", "2026-08"],
  ["endMonth", ""],
  ["summary", "Frontend, backend and admin tools."],
  ["stack", "Next.js, Retool"],
];

function parse(overrides: Record<string, string> = {}, extra: [string, string][] = []) {
  const fd = new FormData();
  for (const [k, v] of base) fd.append(k, overrides[k] ?? v);
  for (const [k, v] of extra) fd.append(k, v);
  return chapterSchema.safeParse(chapterFormValues(fd));
}

describe("month helpers", () => {
  it("round-trips a month through a UTC date", () => {
    const d = monthToDate("2025-04");
    expect(d.toISOString()).toBe("2025-04-01T00:00:00.000Z");
    expect(dateToMonth(d)).toBe("2025-04");
    expect(dateToMonth(null)).toBe("");
  });
});

describe("chapterSchema", () => {
  it("upper-cases the numeral, treats a blank end as present and parses the stack", () => {
    const r = parse();
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({
      numeral: "IV",
      location: null,
      startDate: new Date("2026-08-01T00:00:00Z"),
      endDate: null,
      stack: ["Next.js", "Retool"],
      bullets: [],
    });
  });

  it("keeps bullets in order and drops blank ones", () => {
    const r = parse({}, [
      ["bullet", "Built Retool tools"],
      ["bullet", "  "],
      ["bullet", "Ran the SMS queue"],
    ]);
    expect(r.data?.bullets).toEqual(["Built Retool tools", "Ran the SMS queue"]);
  });

  it(`allows at most ${BULLETS_MAX} bullets`, () => {
    const many = Array.from({ length: BULLETS_MAX + 1 }, (_, i): [string, string] => [
      "bullet",
      `Point ${i}`,
    ]);
    expect(parse({}, many).success).toBe(false);
  });

  it("rejects an end before the start, on the end field", () => {
    const r = parse({ startMonth: "2026-08", endMonth: "2025-04" });
    expect(r.error?.issues[0]?.path).toEqual(["endMonth"]);
  });

  it("accepts the same start and end month", () => {
    expect(parse({ startMonth: "2025-04", endMonth: "2025-04" }).success).toBe(true);
  });

  it.each(["2026-13", "2026-8", "Aug 2026", ""])("rejects the start month %j", (m) => {
    expect(parse({ startMonth: m }).success).toBe(false);
  });

  it.each(["4", "IIII-A", "Chapter 4"])("rejects the numeral %j", (n) => {
    expect(parse({ numeral: n }).success).toBe(false);
  });
});
