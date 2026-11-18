/**
 * A mailto: link that replies to a contact message in the Keeper's own mail app.
 * Everything is URL-encoded, so a sender can't inject extra headers (cc, bcc, body).
 */
export function replyHref(message: { email: string; purpose: string; name: string }) {
  const subject = `Re: ${message.purpose}`.replace(/[\r\n]+/g, " ").slice(0, 150);
  const body = `Hi ${message.name.split(" ")[0] || "there"},\n\n`;
  return `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
