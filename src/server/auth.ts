import "server-only";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, captcha, magicLink } from "better-auth/plugins";
import { parseAdminEmails, roleForEmail } from "@/lib/admin-emails";
import { db } from "./db";
import { magicLinkEmail, sendEmail } from "./email";

/**
 * Sign-in is for the Keeper (site owner) only — there are no visitor accounts.
 * Anyone whose email isn't in ADMIN_EMAILS is refused at every step:
 * no magic link is sent, no user is created, no session is issued.
 */
export const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
const isKeeper = (email: string) => roleForEmail(email, adminEmails) === "admin";

// GitHub is only switched on once its credentials exist,
// so the app runs locally before the OAuth app is created.
const socialProviders: BetterAuthOptions["socialProviders"] = {};
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

export const enabledProviders = {
  github: Boolean(socialProviders.github),
  magicLink: true,
};

const turnstile = process.env.TURNSTILE_SECRET_KEY
  ? [
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: process.env.TURNSTILE_SECRET_KEY,
        endpoints: ["/sign-in/magic-link"],
      }),
    ]
  : [];

export const auth = betterAuth({
  appName: "Matthew Pearce",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  socialProviders,
  // Refused or failed OAuth sign-ins land back on the gate with ?error=… instead of Better Auth's page.
  onAPIError: { errorURL: "/sign-in" },
  account: {
    // Lets the Keeper use magic link or GitHub interchangeably with the same email.
    accountLinking: { enabled: true, trustedProviders: ["github"] },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily while in use
    // Signed cookie copy of the session, so most requests skip the session-table
    // lookup. Trade-off: a revoked session can stay valid for up to 5 minutes.
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  databaseHooks: {
    user: {
      create: {
        // Only allow-listed emails can ever get an account (returning false cancels it).
        before: async (user) =>
          isKeeper(user.email) ? { data: { ...user, role: "admin" } } : false,
      },
    },
    session: {
      create: {
        // Re-check on every sign-in, so removing an email from ADMIN_EMAILS locks that account out.
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { email: true },
          });
          return user && isKeeper(user.email) ? { data: session } : false;
        },
      },
    },
  },
  plugins: [
    admin({ defaultRole: "user", adminRoles: ["admin"] }),
    magicLink({
      expiresIn: 60 * 10,
      sendMagicLink: async ({ email, url }) => {
        // Silently skip strangers: the form looks the same either way, so it can't be used
        // to discover the admin email or to spam other people's inboxes through Resend.
        if (!isKeeper(email)) return;
        await sendEmail({ to: email, ...magicLinkEmail(url) });
      },
    }),
    ...turnstile,
    nextCookies(), // must stay last: lets server actions set auth cookies
  ],
});

export type Session = typeof auth.$Infer.Session;
