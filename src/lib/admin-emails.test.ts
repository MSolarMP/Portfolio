import { describe, expect, it } from "vitest";
import { parseAdminEmails, roleForEmail } from "./admin-emails";

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

describe("roleForEmail", () => {
  const admins = parseAdminEmails("keeper@example.com");

  it("grants admin to allow-listed emails regardless of case", () => {
    expect(roleForEmail("KEEPER@example.com", admins)).toBe("admin");
  });

  it("defaults everyone else to user", () => {
    expect(roleForEmail("visitor@example.com", admins)).toBe("user");
  });
});
