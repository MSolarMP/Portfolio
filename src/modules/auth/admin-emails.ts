/**
 * The Keeper (site owner) is defined by the ADMIN_EMAILS environment variable,
 * a comma-separated list. Comparison is case-insensitive and ignores spaces.
 * This list is the only thing that decides who may sign in.
 */
export function parseAdminEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string, adminEmails: Set<string>): boolean {
  return adminEmails.has(email.trim().toLowerCase());
}
