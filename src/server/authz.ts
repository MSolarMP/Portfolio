import "server-only";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { roleForEmail } from "@/lib/admin-emails";
import { adminEmails, auth } from "./auth";

/** The current session, or null. Memoised for the duration of one request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Any signed-in session. Redirects to the gate otherwise. */
export async function requireUser(next = "/admin") {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return session;
}

/**
 * Keeper (admin) only. Call this in the admin layout AND at the top of every
 * admin server action or route handler — the layout check alone does not
 * protect actions, which can be invoked directly.
 */
export async function requireAdmin(next = "/admin") {
  const session = await requireUser(next);
  // The stored role only re-syncs on sign-in, so also check the live allow-list:
  // removing an email from ADMIN_EMAILS revokes access on the next request.
  if (session.user.role !== "admin" || roleForEmail(session.user.email, adminEmails) !== "admin") {
    forbidden();
  }
  return session;
}
