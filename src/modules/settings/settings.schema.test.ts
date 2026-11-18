import { describe, expect, it } from "vitest";
import {
  readSettings,
  SETTING_DEFAULTS,
  settingsSchema,
  settingsUpdateSchema,
} from "./settings.schema";

/** The full form, with blanks for anything not given. */
function parse(entries: Record<string, string | boolean>) {
  return settingsSchema.safeParse({
    openToWork: false,
    roleType: "",
    githubUrl: "",
    linkedinUrl: "",
    ...entries,
  });
}

describe("settingsSchema", () => {
  it("trims text and turns blanks into null", () => {
    expect(parse({ openToWork: true, roleType: " Full-time " }).data).toEqual({
      openToWork: true,
      roleType: "Full-time",
      githubUrl: null,
      linkedinUrl: null,
    });
  });

  it("refuses unknown settings and a non-boolean openToWork", () => {
    expect(parse({ theme: "dark" }).success).toBe(false);
    expect(parse({ openToWork: "on" }).success).toBe(false);
  });

  it("accepts a partial update", () => {
    expect(settingsUpdateSchema.parse({ openToWork: true })).toEqual({ openToWork: true });
  });

  it.each(["https://github.com/MSolarMP", "https://www.github.com/msolarmp/"])(
    "accepts GitHub %s",
    (url) => {
      expect(parse({ githubUrl: url }).success).toBe(true);
    },
  );

  it.each([
    "https://github.com/MSolarMP/Portfolio",
    "https://gitlab.com/x",
    "http://github.com/x",
    "https://github.com.evil.com/x",
  ])("rejects GitHub %s", (url) =>
    expect(parse({ githubUrl: url }).error?.issues[0]?.path).toEqual(["githubUrl"]),
  );

  it.each(["https://www.linkedin.com/in/matthew-pearce", "https://za.linkedin.com/in/mp/"])(
    "accepts LinkedIn %s",
    (url) => {
      expect(parse({ linkedinUrl: url }).success).toBe(true);
    },
  );

  it.each([
    "https://www.linkedin.com/company/x",
    "https://www.linkedin.com/in/mp?trk=x",
    "https://linkedin.com.evil.com/in/x",
  ])("rejects LinkedIn %s", (url) =>
    expect(parse({ linkedinUrl: url }).error?.issues[0]?.path).toEqual(["linkedinUrl"]),
  );
});

describe("readSettings", () => {
  it("fills in defaults and ignores unknown keys", () => {
    expect(readSettings([{ key: "features", value: { duel: false } }])).toEqual(SETTING_DEFAULTS);
  });

  it("uses stored values of the right type", () => {
    expect(
      readSettings([
        { key: "openToWork", value: true },
        { key: "roleType", value: "Full-time" },
        { key: "githubUrl", value: null },
      ]),
    ).toEqual({ ...SETTING_DEFAULTS, openToWork: true, roleType: "Full-time" });
  });

  it("falls back to the default for a malformed value", () => {
    expect(readSettings([{ key: "openToWork", value: "yes" }]).openToWork).toBe(false);
  });
});
