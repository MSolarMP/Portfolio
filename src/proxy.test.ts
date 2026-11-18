import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie } } : undefined);

describe("proxy (first gate for /admin)", () => {
  it("only runs on /admin routes", () => {
    expect(config.matcher).toEqual(["/admin/:path*"]);
  });

  it("redirects a visitor with no session cookie to sign-in, keeping the destination", () => {
    const res = proxy(request("/admin/quests"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?next=%2Fadmin%2Fquests",
    );
  });

  it("ignores unrelated cookies", () => {
    const res = proxy(request("/admin", "theme=dark; better-auth.other=1"));
    expect(res.headers.get("location")).toContain("/sign-in");
  });

  it("lets a request with a session cookie through (the real check happens in requireAdmin)", () => {
    const res = proxy(request("/admin", "better-auth.session_token=abc.def"));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
