import "server-only";
import { Resend } from "resend";

type Email = { to: string; subject: string; html: string; text: string };

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends a transactional email through Resend.
 * Without RESEND_API_KEY (local development) the email is printed to the
 * server console instead, so sign-in links still work offline.
 */
export async function sendEmail({ to, subject, html, text }: Email) {
  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set — cannot send email in production.");
    }
    console.info(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n${text}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Matthew Pearce <hello@mattcreates.co.za>",
    to,
    subject,
    html,
    text,
  });
  if (error) throw new Error(`Email failed: ${error.message}`);
}

export function magicLinkEmail(url: string) {
  const text = `Your link to enter the ledger:\n\n${url}\n\nIt expires in 10 minutes. If you didn't ask for it, you can ignore this email.`;
  const html = `
  <div lang="en" style="background:#efe3c6;padding:32px 16px;font-family:Georgia,serif;color:#2b2118">
    <div style="display:none;max-height:0;overflow:hidden">Your one-time sign-in link — expires in 10 minutes.</div>
    <div style="max-width:480px;margin:0 auto;background:#f7eeda;border:1px solid #a87b2f;padding:32px;text-align:center">
      <p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#7a5418;margin:0 0 12px">The Gate</p>
      <h1 style="font-size:26px;margin:0 0 16px">Your magic letter has arrived</h1>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px">Use the button below to sign in. It works once and expires in 10 minutes.</p>
      <a href="${url}" style="display:inline-block;background:#7c2d25;color:#f7eeda;text-decoration:none;padding:14px 28px;font-weight:bold;letter-spacing:.1em">Enter the ledger</a>
      <p style="font-size:13px;color:#5c4a36;margin:24px 0 0;word-break:break-all">Button not working? Paste this into your browser:<br>${url}</p>
      <p style="font-size:13px;color:#5c4a36;margin:16px 0 0">Didn't ask for this? You can safely ignore it.</p>
    </div>
  </div>`;
  return { subject: "Your sign-in link · Matthew Pearce", html, text };
}
