import { ApiError } from "@/lib/http/errors";
import { ok, PRIVATE_NO_STORE, PUBLIC_CACHE, route } from "@/lib/http/route";
import { listPublishedQuests, listQuests } from "@/modules/quests";

/**
 * REST controller for outside clients (the admin uses server actions).
 *
 * GET /api/v1/quests             published quests as cards (public, CDN-cached)
 * GET /api/v1/quests?status=all  every quest incl. drafts (Keeper only)
 */
export const GET = route("public", async (req, { isAdmin }) => {
  const status = req.nextUrl.searchParams.get("status") ?? "published";
  if (status === "all") {
    if (!isAdmin) throw new ApiError(401, "unauthenticated", "Sign in to see drafts.");
    return ok(await listQuests(), { headers: PRIVATE_NO_STORE });
  }
  if (status !== "published") {
    throw new ApiError(400, "invalid_query", "status must be 'published' or 'all'.");
  }
  return ok(await listPublishedQuests(), { headers: PUBLIC_CACHE });
});
