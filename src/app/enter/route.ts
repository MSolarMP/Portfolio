import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/server/auth";

/** After sign-in: the Keeper goes to the Archive; anyone else (only possible with a stale session) goes home. */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const destination = !session ? "/sign-in" : session.user.role === "admin" ? "/admin" : "/";
  // 303: always follow with a GET. no-store: the answer depends on the session cookie.
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
