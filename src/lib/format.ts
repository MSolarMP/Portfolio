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
