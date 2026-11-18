// Fixed locale and time zone, so the server render and the browser print the same date
// (otherwise hydration can disagree near midnight or on a differently set machine).
const dateFormat = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Johannesburg",
});

/** "18 Nov 2026". Accepts a Date or an ISO string. */
export function formatDate(value: Date | string) {
  return dateFormat.format(typeof value === "string" ? new Date(value) : value);
}

/** 2_345_678 → "2.2 MB". */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The first `max` characters of `text` on one line, ending in "…" if cut. */
export function excerpt(text: string, max = 110) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

/** "18 Nov 2026, 14:05" in South African time. */
export function formatDateTime(value: Date | string) {
  return dateTimeFormat.format(typeof value === "string" ? new Date(value) : value);
}

const dateTimeFormat = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Johannesburg",
});

// Chronicle dates are stored as the 1st of the month at UTC midnight, so format them in UTC.
const monthFormat = new Intl.DateTimeFormat("en-ZA", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "Apr 2025 – Aug 2026", or "Aug 2026 – present" when there's no end date. */
export function formatMonthRange(start: Date, end: Date | null) {
  return `${monthFormat.format(start)} – ${end ? monthFormat.format(end) : "present"}`;
}
