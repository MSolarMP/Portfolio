import "server-only";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { isAdminEmail } from "./admin-emails";
import { ApiError } from "@/lib/http/errors";
import { adminEmails, auth } from "./auth";

/** The current session, or null. Memoised for the duration of one request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/**
 * Keeper only. Call this in the admin layout AND at the top of every admin
 * server action or route handler — the layout check alone does not protect
 * actions, which can be invoked directly.
 *
 * Checks the live ADMIN_EMAILS list on every call, so removing an email
 * revokes access on the next request.
 */
export async function requireAdmin(next = "/admin") {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (!isAdminEmail(session.user.email, adminEmails)) forbidden();
  return session;
}

/**
 * Keeper only, for REST route handlers: reads the session from the request's own
 * headers and throws an ApiError (401 signed out, 403 not the Keeper) instead of
 * redirecting, so API clients get a status code they can act on.
 */
export async function requireAdminApi(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) throw new ApiError(401, "unauthenticated", "Sign in to do that.");
  if (!isAdminEmail(session.user.email, adminEmails)) {
    throw new ApiError(403, "forbidden", "Only the site's owner can do that.");
  }
  return session;
}
