/**
 * Page copy lookup. Keys used in code must exist in `prisma/seed.ts`.
 * A missing key shows as `[missing: key]` outside production so it gets noticed,
 * and as an empty string in production so visitors never see it.
 */
export function copyReader(blocks: Record<string, string>) {
  return (key: string): string => {
    const text = blocks[key];
    if (text !== undefined) return text;
    return process.env.NODE_ENV === "production" ? "" : `[missing: ${key}]`;
  };
}

/** "Matthew Pearce" → "MP". Used for the wax-seal monogram. */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}
