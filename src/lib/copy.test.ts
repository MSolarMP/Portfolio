import { afterEach, describe, expect, it, vi } from "vitest";
import { copyReader, initials } from "./copy";

describe("copyReader", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the stored text", () => {
    const t = copyReader({ "home.hero.name": "Matthew Pearce" });
    expect(t("home.hero.name")).toBe("Matthew Pearce");
  });

  it("keeps an empty string that was saved on purpose", () => {
    expect(copyReader({ "a.b": "" })("a.b")).toBe("");
  });

  it("flags a missing key outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(copyReader({})("home.nope")).toBe("[missing: home.nope]");
  });

  it("hides a missing key in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(copyReader({})("home.nope")).toBe("");
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Matthew Pearce")).toBe("MP");
    expect(initials("  ada  lovelace king ")).toBe("AL");
  });

  it("handles one word and empty input", () => {
    expect(initials("Keeper")).toBe("K");
    expect(initials("")).toBe("");
  });
});
