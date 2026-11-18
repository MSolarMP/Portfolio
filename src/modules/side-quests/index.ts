/**
 * Side quests module (hobbies on the About page). Public API for pages, route handlers
 * and other modules. Server actions are imported from `./side-quests.actions`, schemas
 * from `./side-quests.schema`; the repository is private to this module.
 */
export {
  countSideQuests,
  createSideQuest,
  deleteSideQuest,
  getPublishedSideQuest,
  getSideQuest,
  listPublishedSideQuests,
  listSideQuests,
  reorderSideQuests,
  updateSideQuest,
  type SideQuestAdmin,
  type SideQuestPublic,
} from "./side-quests.service";
