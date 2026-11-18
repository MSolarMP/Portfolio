import { ApiError } from "@/lib/http/errors";
import { ok, PRIVATE_NO_STORE, PUBLIC_CACHE, route } from "@/lib/http/route";
import { listPublishedSideQuests, listSideQuests } from "@/modules/side-quests";

/**
 * REST controller for external clients (the admin forms use server actions instead).
 *
 * GET /api/v1/side-quests             published side quests (public, CDN-cached)
 * GET /api/v1/side-quests?status=all  every side quest incl. drafts (Keeper only)
 */
export const GET = route("public", async (req, { isAdmin }) => {
  const status = req.nextUrl.searchParams.get("status") ?? "published";
  if (status === "all") {
    if (!isAdmin) throw new ApiError(401, "unauthenticated", "Sign in to see drafts.");
    return ok(await listSideQuests(), { headers: PRIVATE_NO_STORE });
  }
  if (status !== "published") {
    throw new ApiError(400, "invalid_query", "status must be 'published' or 'all'.");
  }
  return ok(await listPublishedSideQuests(), { headers: PUBLIC_CACHE });
});
