/**
 * Cache tags used with `'use cache'` + `cacheTag()` on reads and
 * `updateTag()` (server actions) / `revalidateTag(tag, 'max')` (route handlers, jobs) on writes.
 * Keep every tag name here so reads and writes can't drift apart.
 */
export const tags = {
  content: (page: string) => `content:${page}`,
  interests: "interests",
  quests: "quests",
  quest: (slug: string) => `quest:${slug}`,
  chronicle: "chronicle",
  skills: "skills",
  media: "media",
  settings: "settings",
  commendations: "commendations",
} as const;
