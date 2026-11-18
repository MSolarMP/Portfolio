import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { NextRequest } from "next/server";
import { type Problem, PROBLEM_CONTENT_TYPE } from "@/lib/http/problem";
import { requireAdminApi } from "@/modules/auth";
import {
  ConflictError,
  DuplicateError,
  MissingReferenceError,
  NotFoundError,
  UnavailableError,
  ValidationError,
} from "@/lib/errors";
import { ApiError, statusTitle } from "@/lib/http/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type Access = "public" | "admin";

export type HandlerContext<P> = {
  params: P;
  requestId: string;
  /** True when the caller is the signed-in Keeper (always true for `admin` routes). */
  isAdmin: boolean;
};

/**
 * Wraps a route handler (the "controller") with what every endpoint needs:
 *
 * - a request id, returned as `X-Request-Id` and in error bodies;
 * - CSRF protection: unsafe methods must send an `Origin` matching this site;
 * - access: `admin` → 401/403 unless the Keeper is signed in; `public` → anyone,
 *   with `isAdmin` set if the Keeper happens to be signed in;
 * - errors: `ApiError` and domain errors become RFC 9457 problem+json; anything
 *   else is logged with the request id and returned as a bare 500.
 */
export function route<P = Record<string, never>>(
  access: Access,
  handler: (req: NextRequest, ctx: HandlerContext<P>) => Promise<Response>,
) {
  return async (req: NextRequest, routeCtx: { params: Promise<P> }) => {
    const requestId = crypto.randomUUID();
    let response: Response;
    try {
      if (!SAFE_METHODS.has(req.method)) checkOrigin(req);
      const isAdmin =
        access === "admin" ? (await requireAdminApi(req), true) : await isKeeperRequest(req);
      const params = (await routeCtx?.params) ?? ({} as P);
      response = await handler(req, { params, requestId, isAdmin });
    } catch (err) {
      // Next.js signals (prerender bail-outs, redirect, notFound) are thrown as errors;
      // they must reach Next untouched rather than become a 500.
      unstable_rethrow(err);
      response = errorResponse(err, requestId);
    }
    response.headers.set("X-Request-Id", requestId);
    return response;
  };
}

/** Browsers always send `Origin` on cross-site and same-site unsafe requests. */
function checkOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin) {
    throw new ApiError(403, "cross_origin", "Requests must come from this site.");
  }
}

/** For public routes: is the Keeper signed in? Never throws. */
async function isKeeperRequest(req: NextRequest) {
  if (!req.headers.get("cookie")) return false; // skip the session lookup for most visitors
  try {
    await requireAdminApi(req);
    return true;
  } catch {
    return false;
  }
}

export function problem(
  status: number,
  code: string,
  requestId: string,
  detail?: string,
  extra: { errors?: Record<string, string>; headers?: Record<string, string> } = {},
) {
  const body: Problem = {
    type: "about:blank",
    title: statusTitle(status),
    status,
    code,
    detail,
    requestId,
    ...(extra.errors && { errors: extra.errors }),
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": PROBLEM_CONTENT_TYPE, ...extra.headers },
  });
}

/** Maps a thrown error to a problem response. Exported for tests. */
export function errorResponse(err: unknown, requestId: string): Response {
  if (err instanceof ApiError) {
    return problem(err.status, err.code, requestId, err.message, err.extra);
  }
  if (err instanceof ValidationError) {
    return problem(422, "validation_failed", requestId, err.message, { errors: err.errors });
  }
  if (err instanceof NotFoundError) {
    return problem(404, "not_found", requestId, err.message);
  }
  if (err instanceof ConflictError) {
    return problem(409, err.code, requestId, err.message, { errors: err.errors });
  }
  if (err instanceof UnavailableError) {
    return problem(503, "unavailable", requestId, err.message, {
      headers: { "Retry-After": "30" },
    });
  }
  // Repositories' persistence errors should be translated by services; this is the backstop.
  if (err instanceof DuplicateError) {
    return problem(409, "duplicate", requestId, "That value is already in use.");
  }
  if (err instanceof MissingReferenceError) {
    return problem(422, "missing_reference", requestId, "A linked record no longer exists.");
  }
  console.error(`[api] ${requestId}`, err);
  return problem(500, "internal_error", requestId, "Something went wrong on our side.");
}

/** 200 with `{ data }`. */
export function ok(data: unknown, init: { headers?: Record<string, string> } = {}) {
  return Response.json({ data }, { status: 200, headers: init.headers });
}

/** 201 with `{ data }` and a `Location` header pointing at the new resource. */
export function created(data: unknown, location: string) {
  return Response.json({ data }, { status: 201, headers: { Location: location } });
}

/** 204, no body. */
export function noContent() {
  return new Response(null, { status: 204 });
}

/** Cache header for public reads: CDN keeps it briefly and serves stale while refreshing. */
export const PUBLIC_CACHE = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
/** Responses that depend on who's asking must never be stored by a shared cache. */
export const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };
