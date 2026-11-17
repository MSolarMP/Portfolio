/**
 * Keepers (admins) are defined by the ADMIN_EMAILS environment variable,
 * a comma-separated list. Comparison is case-insensitive and ignores spaces.
 */
export function parseAdminEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function roleForEmail(email: string, adminEmails: Set<string>): "admin" | "user" {
  return adminEmails.has(email.trim().toLowerCase()) ? "admin" : "user";
}
