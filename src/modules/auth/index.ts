/**
 * Auth module: owner-only sign-in (Better Auth, magic link) and the Keeper checks.
 * Other modules and routes import from here, never from the files inside.
 */
export { auth, adminEmails } from "./auth";
export { getSession, requireAdmin, requireAdminApi } from "./authz";
