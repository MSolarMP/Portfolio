import { describe, expect, it } from "vitest";
import { experience } from "./experience";

describe("experience", () => {
  it("counts whole years as the level and the rest as progress", () => {
    const { level, progress } = experience(new Date("2022-02-01"), new Date("2026-11-18"));
    expect(level).toBe(4);
    expect(progress).toBeCloseTo(0.79, 2);
  });

  it("is level 0 with no progress for a start in the future", () => {
    expect(experience(new Date("2030-01-01"), new Date("2026-11-18"))).toEqual({
      level: 0,
      progress: 0,
    });
  });
});
