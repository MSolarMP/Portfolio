import { describe, expect, it } from "vitest";
import { formatMonthRange } from "./format";

describe("formatMonthRange", () => {
  it("prints start and end months", () => {
    expect(formatMonthRange(new Date("2025-04-01"), new Date("2026-08-01"))).toBe(
      "Apr 2025 – Aug 2026",
    );
  });

  it("says present when there is no end", () => {
    expect(formatMonthRange(new Date("2026-08-01"), null)).toBe("Aug 2026 – present");
  });

  it("reads the stored UTC date, not the local one", () => {
    // Midnight UTC on the 1st is still the previous day in time zones west of UTC.
    expect(formatMonthRange(new Date("2022-02-01T00:00:00Z"), null)).toBe("Feb 2022 – present");
  });
});
