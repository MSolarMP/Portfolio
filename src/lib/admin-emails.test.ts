import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails } from "./admin-emails";

describe("parseAdminEmails", () => {
  it("returns an empty set when unset", () => {
    expect(parseAdminEmails(undefined).size).toBe(0);
    expect(parseAdminEmails("").size).toBe(0);
  });

  it("splits, trims, lowercases and drops blanks", () => {
    const set = parseAdminEmails(" Keeper@Example.com, ,second@example.com ");
    expect([...set]).toEqual(["keeper@example.com", "second@example.com"]);
  });
});

describe("isAdminEmail", () => {
  const admins = parseAdminEmails("keeper@example.com");

  it("accepts allow-listed emails regardless of case", () => {
    expect(isAdminEmail("KEEPER@example.com", admins)).toBe(true);
  });

  it("rejects everyone else", () => {
    expect(isAdminEmail("visitor@example.com", admins)).toBe(false);
  });
});
