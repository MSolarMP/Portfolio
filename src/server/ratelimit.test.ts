import { describe, expect, it, vi } from "vitest";
import { allow, clientIp, hashKey, limitMagicLink, retryMessage } from "./ratelimit";

/** A fake limiter that allows the first `max` calls per identifier. */
function fakeLimiter(max: number) {
  const seen = new Map<string, number>();
  return {
    calls: seen,
    limit: vi.fn(async (id: string) => {
      const n = (seen.get(id) ?? 0) + 1;
      seen.set(id, n);
      return { success: n <= max, reset: Date.now() + 5 * 60_000 };
    }),
  };
}

const magicLinkRequest = (email: string, ip = "203.0.113.7") =>
  new Request("http://localhost:3000/api/auth/sign-in/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `${ip}, 10.0.0.1` },
    body: JSON.stringify({ email, callbackURL: "/enter" }),
  });

describe("helpers", () => {
  it("hashes identifiers, ignoring case and spaces, and never returns the raw value", () => {
    expect(hashKey(" Keeper@Example.com ")).toBe(hashKey("keeper@example.com"));
    expect(hashKey("keeper@example.com")).not.toContain("keeper");
    expect(hashKey("a")).toHaveLength(32);
  });

  it("reads the client IP from Vercel's headers", () => {
    expect(clientIp(new Headers({ "x-real-ip": "1.2.3.4" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("words the retry time", () => {
    expect(retryMessage(1)).toBe("Try again in 1 second.");
    expect(retryMessage(40)).toBe("Try again in 40 seconds.");
    expect(retryMessage(61)).toBe("Try again in 2 minutes.");
  });
});

describe("allow", () => {
  it("allows everything when rate limiting isn't configured", async () => {
    expect(await allow(null, "x")).toEqual({ ok: true });
  });

  it("allows the request if Upstash fails, rather than locking the Keeper out", async () => {
    const broken = { limit: async () => Promise.reject(new Error("network")) };
    vi.spyOn(console, "error").mockImplementationOnce(() => {});
    expect(await allow(broken, "x")).toEqual({ ok: true });
  });

  it("blocks once the limit is used up and says when to retry", async () => {
    const l = fakeLimiter(1);
    expect(await allow(l, "x")).toEqual({ ok: true });
    const second = await allow(l, "x");
    expect(second.ok).toBe(false);
    expect(!second.ok && second.retryAfterSeconds).toBeGreaterThan(200);
  });
});

describe("limitMagicLink", () => {
  it("lets requests through under the limits", async () => {
    const limiters = { ip: fakeLimiter(5), email: fakeLimiter(5) };
    expect(await limitMagicLink(magicLinkRequest("a@example.com"), limiters)).toBeNull();
  });

  it("returns 429 with Retry-After once one IP asks too often", async () => {
    const limiters = { ip: fakeLimiter(2), email: fakeLimiter(100) };
    for (const email of ["a@x.io", "b@x.io"]) {
      expect(await limitMagicLink(magicLinkRequest(email), limiters)).toBeNull();
    }
    const res = await limitMagicLink(magicLinkRequest("c@x.io"), limiters);
    expect(res?.status).toBe(429);
    expect(Number(res?.headers.get("retry-after"))).toBeGreaterThan(0);
    expect((await res?.json()).message).toMatch(
      /^Too many sign-in letters requested\. Try again in/,
    );
  });

  it("limits one email address even across different IPs", async () => {
    const limiters = { ip: fakeLimiter(100), email: fakeLimiter(2) };
    await limitMagicLink(magicLinkRequest("victim@x.io", "1.1.1.1"), limiters);
    await limitMagicLink(magicLinkRequest("victim@x.io", "2.2.2.2"), limiters);
    const res = await limitMagicLink(magicLinkRequest("Victim@X.io", "3.3.3.3"), limiters);
    expect(res?.status).toBe(429);
  });

  it("never stores the raw IP or email", async () => {
    const limiters = { ip: fakeLimiter(5), email: fakeLimiter(5) };
    await limitMagicLink(magicLinkRequest("keeper@example.com"), limiters);
    const keys = [...limiters.ip.calls.keys(), ...limiters.email.calls.keys()].join(" ");
    expect(keys).not.toMatch(/keeper|example|203\.0\.113/);
  });

  it("leaves the request body readable for Better Auth", async () => {
    const req = magicLinkRequest("a@example.com");
    await limitMagicLink(req, { ip: fakeLimiter(5), email: fakeLimiter(5) });
    expect((await req.json()).email).toBe("a@example.com");
  });
});
