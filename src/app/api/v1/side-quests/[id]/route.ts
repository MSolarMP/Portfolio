import { ok, PRIVATE_NO_STORE, PUBLIC_CACHE, route } from "@/lib/http/route";
import { getPublishedSideQuest, getSideQuest } from "@/modules/side-quests";

/**
 * GET /api/v1/side-quests/{id}  one side quest: published only, or any (incl. drafts) for the Keeper.
 * 404 problem+json when it doesn't exist or isn't visible.
 */
export const GET = route<{ id: string }>("public", async (_req, { params, isAdmin }) =>
  isAdmin
    ? ok(await getSideQuest(params.id), { headers: PRIVATE_NO_STORE })
    : ok(await getPublishedSideQuest(params.id), { headers: PUBLIC_CACHE }),
);
