import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limits, shared across every server instance through Upstash Redis.
 *
 * They protect against abuse (inbox spam through the sign-in form, runaway uploads);
 * they are not access control — ADMIN_EMAILS is. So when Upstash isn't configured or
 * doesn't answer within a second, requests are allowed and the problem is logged.
 */

type Limiter = { limit: (id: string) => Promise<{ success: boolean; reset: number }> };

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

function make(prefix: string, limiter: ReturnType<typeof Ratelimit.slidingWindow>): Limiter | null {
  return redis
    ? new Ratelimit({ redis, prefix: `rl:${prefix}`, limiter, timeout: 1000, analytics: false })
    : null;
}

export const limits = {
  /** Magic-link emails requested from one IP address. */
  signInIp: make("signin-ip", Ratelimit.slidingWindow(5, "10 m")),
  /** Magic-link emails requested for one email address, from anywhere. */
  signInEmail: make("signin-email", Ratelimit.slidingWindow(5, "10 m")),
  /** Media uploads by the Keeper: a backstop against a stuck loop or a stolen session. */
  upload: make("upload", Ratelimit.slidingWindow(30, "1 h")),
};

/** Identifiers are hashed, so Redis never holds a raw IP address or email. */
export function hashKey(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 32);
}

type LimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

let warned = false;

/** Checks one limit for one identifier. Never throws. */
export async function allow(limiter: Limiter | null, identifier: string): Promise<LimitResult> {
  if (!limiter) {
    if (process.env.NODE_ENV === "production" && !warned) {
      warned = true;
      console.error(
        "Rate limiting is off: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      );
    }
    return { ok: true };
  }
  try {
    const { success, reset } = await limiter.limit(hashKey(identifier));
    return success
      ? { ok: true }
      : { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch (err) {
    console.error("Rate limit check failed; allowing the request.", err);
    return { ok: true };
  }
}

/** The visitor's IP as Vercel reports it ("unknown" locally). */
export function clientIp(headers: Headers) {
  return (
    headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

/** "Try again in 7 minutes." / "Try again in 40 seconds." */
export function retryMessage(seconds: number) {
  if (seconds < 60) return `Try again in ${seconds} second${seconds === 1 ? "" : "s"}.`;
  const minutes = Math.ceil(seconds / 60);
  return `Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

/**
 * For POST /api/auth/sign-in/magic-link: a 429 response if this IP or this email has
 * asked for too many links, or null to carry on. The message is shown on the sign-in form.
 */
export async function limitMagicLink(
  request: Request,
  limiters: { ip: Limiter | null; email: Limiter | null } = {
    ip: limits.signInIp,
    email: limits.signInEmail,
  },
): Promise<Response | null> {
  const byIp = await allow(limiters.ip, clientIp(request.headers));
  let blocked = byIp.ok ? null : byIp;

  if (!blocked) {
    const body = (await request
      .clone()
      .json()
      .catch(() => null)) as { email?: unknown } | null;
    if (typeof body?.email === "string" && body.email.trim()) {
      const byEmail = await allow(limiters.email, body.email);
      if (!byEmail.ok) blocked = byEmail;
    }
  }

  if (!blocked) return null;
  return Response.json(
    {
      code: "RATE_LIMITED",
      message: `Too many sign-in letters requested. ${retryMessage(blocked.retryAfterSeconds)}`,
    },
    { status: 429, headers: { "Retry-After": String(blocked.retryAfterSeconds) } },
  );
}
