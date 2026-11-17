import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/server/auth";

/** After sign-in: into the Archive. The admin layout re-checks the allow-list. */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  // 303: always follow with a GET. no-store: the answer depends on the session cookie.
  const response = NextResponse.redirect(
    new URL(session ? "/admin" : "/sign-in", request.url),
    303,
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
