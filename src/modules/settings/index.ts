/**
 * Settings module: availability and profile links. Public API for pages and route handlers.
 * Server actions: `./settings.actions`; schemas: `./settings.schema`.
 */
export { getPublicSettings, getSettings, saveSettings } from "./settings.service";
export type { Settings } from "./settings.schema";
