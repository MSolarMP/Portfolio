/**
 * Media module (the vault). Public API for pages and other modules.
 * Server actions: `./media.actions`; schemas: `./media.schema`. Storage, image
 * processing and the repository are private to this module.
 */
export {
  deleteMedia,
  getMedia,
  listMedia,
  listMediaOptions,
  mediaExists,
  publicImageSelect,
  toPublicImage,
  updateMediaDetails,
  uploadImage,
  type MediaOption,
  type PublicImage,
  type VariantMap,
} from "./media.service";
