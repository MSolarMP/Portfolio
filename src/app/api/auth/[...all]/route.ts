import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";
import { limitMagicLink } from "@/server/ratelimit";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

/** Better Auth's endpoints, with a shared rate limit in front of magic-link requests. */
export async function POST(request: Request) {
  if (new URL(request.url).pathname.endsWith("/sign-in/magic-link")) {
    const limited = await limitMagicLink(request);
    if (limited) return limited;
  }
  return handler.POST(request);
}
