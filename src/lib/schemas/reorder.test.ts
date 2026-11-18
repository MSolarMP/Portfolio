import { describe, expect, it } from "vitest";
import { isSameSet } from "./reorder";

describe("isSameSet", () => {
  it("accepts the same ids in any order", () => {
    expect(isSameSet(["b", "a", "c"], ["a", "b", "c"])).toBe(true);
  });
  it.each([
    [
      ["a", "a", "b"],
      ["a", "b", "c"],
    ],
    [
      ["a", "b"],
      ["a", "b", "c"],
    ],
    [
      ["a", "b", "c", "d"],
      ["a", "b", "c"],
    ],
    [
      ["a", "b", "x"],
      ["a", "b", "c"],
    ],
  ])("rejects %j against %j", (ids, current) => expect(isSameSet(ids, current)).toBe(false));
});
