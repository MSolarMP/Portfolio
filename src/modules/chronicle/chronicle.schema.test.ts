import { describe, expect, it } from "vitest";
import { BULLETS_MAX, chapterSchema, dateToMonth, monthToDate } from "./chronicle.schema";

const base = {
  numeral: " iv ",
  role: "Software Engineer",
  company: "FantasyGo",
  location: "",
  startMonth: "2026-08",
  endMonth: "",
  summary: "Frontend, backend and admin tools.",
  bullets: [] as string[],
  stack: ["Next.js", "Retool"] as string[] | string,
};

const parse = (overrides: Partial<typeof base> & Record<string, unknown> = {}) =>
  chapterSchema.safeParse({ ...base, ...overrides });

describe("month helpers", () => {
  it("round-trips a month through a UTC date", () => {
    const d = monthToDate("2025-04");
    expect(d.toISOString()).toBe("2025-04-01T00:00:00.000Z");
    expect(dateToMonth(d)).toBe("2025-04");
    expect(dateToMonth(null)).toBe("");
  });
});

describe("chapterSchema", () => {
  it("upper-cases the numeral, treats a blank end as present and keeps the stack", () => {
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

  it("accepts null as 'present' and a comma-separated stack", () => {
    const r = parse({ endMonth: null as unknown as string, stack: "Next.js, retool, Retool" });
    expect(r.data).toMatchObject({ endDate: null, stack: ["Next.js", "retool"] });
  });

  it("keeps bullets in order and drops blank ones", () => {
    const r = parse({ bullets: ["Built Retool tools", "  ", "Ran the SMS queue"] });
    expect(r.data?.bullets).toEqual(["Built Retool tools", "Ran the SMS queue"]);
  });

  it(`allows at most ${BULLETS_MAX} bullets`, () => {
    const bullets = Array.from({ length: BULLETS_MAX + 1 }, (_, i) => `Point ${i}`);
    expect(parse({ bullets }).success).toBe(false);
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

  it("refuses unknown fields", () => {
    expect(parse({ order: 3 }).success).toBe(false);
  });
});
