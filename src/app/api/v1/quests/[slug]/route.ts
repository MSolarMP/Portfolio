import { ok, PUBLIC_CACHE, route } from "@/lib/http/route";
import { getPublishedQuest } from "@/modules/quests";

/**
 * GET /api/v1/quests/{slug}  one published case study: every section as Tiptap JSON,
 * its chapter, diagram and the previous/next quests. 404 problem+json for drafts.
 */
export const GET = route<{ slug: string }>("public", async (_req, { params }) =>
  ok(await getPublishedQuest(params.slug), { headers: PUBLIC_CACHE }),
);
