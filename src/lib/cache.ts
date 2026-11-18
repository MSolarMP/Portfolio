import "server-only";
import { revalidateTag } from "next/cache";

/**
 * Marks cached reads with these tags as expired after a write. `expire: 0` means the next
 * visitor gets fresh data instead of one stale view, so the Keeper sees an edit straight away.
 * (`updateTag` would do the same but only works inside server actions.)
 */
export function invalidate(...tags: string[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}
