import { describe, expect, it } from "vitest";
import {
  commendationFormValues,
  commendationSchema,
  dateToDay,
  dayToDate,
  QUOTE_MAX,
} from "./commendation";

const base: Record<string, string> = {
  quote: "  Matthew rebuilt our platform without missing a beat.  ",
  name: "Jane Doe",
  headline: "CTO at Example",
  relationship: "",
  givenOn: "",
  profileUrl: "",
  status: "DRAFT",
};

function parse(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...base, ...overrides })) fd.append(k, v);
  return commendationSchema.safeParse(commendationFormValues(fd));
}

describe("day helpers", () => {
  it("round-trips a day through a UTC date", () => {
    expect(dateToDay(dayToDate("2025-04-30"))).toBe("2025-04-30");
    expect(dateToDay(null)).toBe("");
  });
});

describe("commendationSchema", () => {
  it("trims the quote and turns blank optionals into null", () => {
    expect(parse().data).toMatchObject({
      quote: "Matthew rebuilt our platform without missing a beat.",
      relationship: null,
      givenOn: null,
      profileUrl: null,
      featured: false,
    });
  });

  it("stores the date as UTC midnight", () => {
    expect(parse({ givenOn: "2025-04-30" }).data?.givenOn).toEqual(
      new Date("2025-04-30T00:00:00Z"),
    );
  });

  it.each(["30/04/2025", "2025-13-01", "2999-01-01"])("rejects the date %j", (givenOn) => {
    expect(parse({ givenOn }).error?.issues[0]?.path).toEqual(["givenOn"]);
  });

  it.each([
    "https://www.linkedin.com/in/jane-doe",
    "https://linkedin.com/in/jane",
    "https://za.linkedin.com/in/jane",
  ])("accepts the profile %s", (profileUrl) => {
    expect(parse({ profileUrl }).success).toBe(true);
  });

  it.each([
    "http://www.linkedin.com/in/jane",
    "https://evil.com/linkedin.com/in/jane",
    "https://linkedin.com.evil.com/in/jane",
    "https://www.linkedin.com/",
  ])("rejects the profile %s", (profileUrl) => {
    expect(parse({ profileUrl }).error?.issues[0]?.path).toEqual(["profileUrl"]);
  });

  it("requires a quote and a name, and caps the quote", () => {
    expect(parse({ quote: " " }).success).toBe(false);
    expect(parse({ name: "" }).success).toBe(false);
    expect(parse({ quote: "a".repeat(QUOTE_MAX + 1) }).success).toBe(false);
  });
});
