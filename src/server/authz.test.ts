import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  forbidden: () => {
    throw new Error("FORBIDDEN");
  },
}));
vi.mock("./auth", () => ({
  auth: { api: { getSession } },
  adminEmails: new Set(["keeper@example.com"]),
}));

const { requireAdmin } = await import("./authz");

const session = (email: string) => ({ user: { email }, session: { id: "s1" } });

beforeEach(() => getSession.mockReset());

describe("requireAdmin", () => {
  it("sends someone with no session to sign-in, remembering where they were going", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireAdmin("/admin/quests/q 1")).rejects.toThrow(
      "REDIRECT /sign-in?next=%2Fadmin%2Fquests%2Fq%201",
    );
  });

  it("refuses a signed-in stranger with 403", async () => {
    getSession.mockResolvedValue(session("stranger@example.com"));
    await expect(requireAdmin()).rejects.toThrow("FORBIDDEN");
  });

  it("refuses an email that was removed from ADMIN_EMAILS, even with a live session", async () => {
    getSession.mockResolvedValue(session("old-keeper@example.com"));
    await expect(requireAdmin()).rejects.toThrow("FORBIDDEN");
  });

  it("lets the Keeper in, ignoring case and spaces in the email", async () => {
    const s = session(" Keeper@Example.com ");
    getSession.mockResolvedValue(s);
    await expect(requireAdmin()).resolves.toBe(s);
  });
});
