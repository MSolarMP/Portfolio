/**
 * Every admin server action must check the Keeper's session before doing anything.
 *
 * Server actions are public HTTP endpoints: anyone can call one directly, skipping the
 * admin layout. This test finds every `actions.ts` under /admin, makes `requireAdmin()`
 * refuse (as it does for a stranger), calls every exported action, and checks that each
 * one stops right there: no database query, storage call, rate-limit check, cache refresh or redirect.
 * A new action that forgets `requireAdmin()` fails this test.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const touched: string[] = [];
const record = (what: string) => () => {
  touched.push(what);
  throw new Error(`${what} was reached without an access check`);
};

/** A stand-in Prisma client: any property access records it and throws. */
const dbProxy = new Proxy(
  {},
  {
    get: (_t, model) =>
      new Proxy(() => {}, {
        get: (_t2, method) => record(`db.${String(model)}.${String(method)}`),
        apply: () => record(`db.${String(model)}()`)(),
      }),
  },
);

class Refused extends Error {}

vi.mock("@/server/authz", () => ({
  requireAdmin: vi.fn(async () => {
    throw new Refused("not the Keeper");
  }),
}));
vi.mock("@/server/db", () => ({ db: dbProxy, jsonOrNull: record("jsonOrNull") }));
vi.mock("@/server/media/storage", () => ({
  buckets: { originals: "originals", public: "media" },
  putObject: record("storage.putObject"),
  removeObjects: record("storage.removeObjects"),
  publicUrl: record("storage.publicUrl"),
}));
vi.mock("@/server/media/process", () => ({ processImage: record("processImage") }));
vi.mock("@/server/ratelimit", () => ({
  limits: {},
  allow: record("ratelimit.allow"),
  retryMessage: () => "",
}));
vi.mock("next/cache", () => ({
  updateTag: record("updateTag"),
  revalidateTag: record("revalidateTag"),
  refresh: record("refresh"),
}));
vi.mock("next/navigation", () => ({ redirect: record("redirect") }));

// Every actions.ts under src/app/admin, found at test time.
const modules = import.meta.glob<Record<string, unknown>>("/src/app/admin/**/actions.ts");

beforeEach(() => {
  touched.length = 0;
});

describe("admin server actions", () => {
  it("finds the action files", () => {
    // Guard against the glob silently matching nothing.
    expect(Object.keys(modules).length).toBeGreaterThanOrEqual(9);
  });

  for (const [path, load] of Object.entries(modules)) {
    const name = path.replace("/src/app/admin/", "");

    it(`${name}: every action refuses a non-Keeper before touching anything`, async () => {
      const mod = await load();
      const actions = Object.entries(mod).filter(([, v]) => typeof v === "function");
      expect(actions.length, `${name} exports no actions`).toBeGreaterThan(0);

      for (const [exportName, action] of actions) {
        touched.length = 0;
        // Plausible arguments for any signature: (id, prevState, formData) or (prevState, formData) or (ids).
        const args = ["some-id", { status: "idle" }, new FormData()];
        await expect(
          (action as (...a: unknown[]) => Promise<unknown>)(...args),
          `${name} → ${exportName} did not refuse`,
        ).rejects.toBeInstanceOf(Refused);
        expect(touched, `${name} → ${exportName} reached: ${touched.join(", ")}`).toEqual([]);
      }
    });
  }
});
