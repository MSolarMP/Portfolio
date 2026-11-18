import { describe, expect, it } from "vitest";
import { toRoman } from "./roman";

describe("toRoman", () => {
  it.each([
    [1, "I"],
    [4, "IV"],
    [5, "V"],
    [9, "IX"],
    [14, "XIV"],
    [40, "XL"],
    [2026, "MMXXVI"],
  ])("%i → %s", (n, expected) => {
    expect(toRoman(n)).toBe(expected);
  });

  it("is empty below 1", () => {
    expect(toRoman(0)).toBe("");
    expect(toRoman(-3)).toBe("");
  });
});
