const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

/**
 * The hero's "level" and mana bar: whole years since the first Chronicle chapter began,
 * and how far through the current year it is (0–1).
 */
export function experience(since: Date, now: Date) {
  const years = Math.max(0, (now.getTime() - since.getTime()) / YEAR_MS);
  const level = Math.floor(years);
  return { level, progress: years - level };
}
