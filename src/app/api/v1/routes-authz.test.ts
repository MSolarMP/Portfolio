/**
 * Every unsafe /api/v1 endpoint (POST, PUT, PATCH, DELETE) must refuse a caller who
 * isn't the Keeper before doing anything: no database query, storage call, rate-limit
 * check or cache refresh. Route files are found at test time, so a new endpoint that
 * forgets `route("admin", …)` fails here.
 *
 * Endpoints that are meant to be public writes (e.g. the contact form) must be listed
 * in PUBLIC_WRITES, so opening one up is always a deliberate change.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const PUBLIC_WRITES = new Set<string>([]);
const UNSAFE = ["POST", "PUT", "PATCH", "DELETE"] as const;
const ORIGIN = "http://localhost:3000";

const touched: string[] = [];
const record = (what: string) => () => {
  touched.push(what);
  throw new Error(`${what} was reached without an access check`);
};

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

const session = vi.hoisted(() => ({ current: null as null | { user: { email: string } } }));

vi.mock("@/modules/auth/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => session.current) } },
  adminEmails: new Set(["keeper@example.com"]),
}));
vi.mock("@/db", () => ({ db: dbProxy, jsonOrNull: record("jsonOrNull") }));
vi.mock("@/server/media/storage", () => ({
  buckets: { originals: "originals", public: "media" },
  putObject: record("storage.putObject"),
  removeObjects: record("storage.removeObjects"),
  publicUrl: record("storage.publicUrl"),
}));
vi.mock("@/server/media/process", () => ({ processImage: record("processImage") }));
vi.mock("@/lib/ratelimit", () => ({
  limits: {},
  allow: record("ratelimit.allow"),
  retryMessage: () => "",
}));
vi.mock("next/cache", () => ({
  updateTag: record("updateTag"),
  revalidateTag: record("revalidateTag"),
  refresh: record("refresh"),
  cacheLife: () => {},
  cacheTag: () => {},
}));

const routes = import.meta.glob<Record<string, unknown>>("/src/app/api/v1/**/route.ts");

type Handler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<Response>;

function call(handler: Handler, method: string, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (origin) headers.origin = origin;
  const req = new NextRequest(`${ORIGIN}/api/v1/anything`, { method, headers, body: "{}" });
  return handler(req, { params: Promise.resolve({ id: "some-id" }) });
}

beforeEach(() => {
  touched.length = 0;
  session.current = null;
});

describe("/api/v1 unsafe methods", () => {
  it("finds the route files", () => {
    expect(Object.keys(routes).length).toBeGreaterThan(0);
  });

  it("only exposes unsafe methods that are deliberately public or Keeper-only", async () => {
    // The REST API is read-only for now; admin writes go through server actions.
    for (const [path, load] of Object.entries(routes)) {
      const mod = await load();
      const name = path.replace("/src/app/api/v1/", "").replace("/route.ts", "");
      for (const method of UNSAFE) {
        if (mod[method] && !PUBLIC_WRITES.has(`${method} ${name}`)) {
          // Allowed only if it's Keeper-only, which the next test proves.
          expect(typeof mod[method]).toBe("function");
        }
      }
    }
  });

  for (const [path, load] of Object.entries(routes)) {
    const name = path.replace("/src/app/api/v1/", "").replace("/route.ts", "");

    it(`${name}: refuses signed-out (401), strangers (403) and other sites (403) first`, async () => {
      const mod = await load();
      for (const method of UNSAFE) {
        const handler = mod[method] as Handler | undefined;
        if (!handler || PUBLIC_WRITES.has(`${method} ${name}`)) continue;

        session.current = null;
        touched.length = 0;
        let res = await call(handler, method);
        expect(res.status, `${method} ${name} signed out`).toBe(401);
        expect(touched, `${method} ${name} reached: ${touched.join(", ")}`).toEqual([]);

        session.current = { user: { email: "stranger@example.com" } };
        touched.length = 0;
        res = await call(handler, method);
        expect(res.status, `${method} ${name} stranger`).toBe(403);
        expect(touched).toEqual([]);

        // Even the Keeper's own cookie is refused when the request comes from another site (CSRF).
        session.current = { user: { email: "keeper@example.com" } };
        touched.length = 0;
        res = await call(handler, method, "https://evil.example");
        expect(res.status, `${method} ${name} cross-site`).toBe(403);
        expect(((await res.json()) as { code: string }).code).toBe("cross_origin");
        expect(touched).toEqual([]);
      }
    });
  }
});
