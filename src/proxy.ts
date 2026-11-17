import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast first gate: bounce visitors with no session cookie away from private
 * areas before any rendering happens. This only checks that a cookie exists —
 * the real session and role checks happen server-side in `requireAdmin`.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
