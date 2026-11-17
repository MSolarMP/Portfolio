import "server-only";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { isAdminEmail } from "@/lib/admin-emails";
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
