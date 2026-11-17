import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps same-site relative paths", () => {
    expect(safeNext("/admin")).toBe("/admin");
    expect(safeNext("/admin/quests?status=draft")).toBe("/admin/quests?status=draft");
  });

  it("falls back when missing", () => {
    expect(safeNext(null)).toBe("/enter");
    expect(safeNext("")).toBe("/enter");
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/%2fevil.com",
    "/%5Cevil.com",
    "/admin\n",
    "javascript:alert(1)",
  ])("rejects %j", (raw) => {
    expect(safeNext(raw)).toBe("/enter");
  });
});
