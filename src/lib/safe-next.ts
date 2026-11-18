/**
 * Only allow same-site relative paths as a post-sign-in destination.
 * Mirrors Better Auth's callback-URL rule: rejects protocol-relative ("//x"),
 * backslash ("/\x", which browsers treat as "//x"), encoded slashes and
 * control characters, so a bad `next` falls back quietly instead of erroring.
 */
export function safeNext(raw: string | null | undefined, fallback = "/admin"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f]|%2f|%5c/i.test(raw)) return fallback;
  return raw;
}
