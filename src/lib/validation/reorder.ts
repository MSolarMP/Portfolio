import { z } from "zod";

/** A new display order for an admin list: every id, top to bottom. */
export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

/** True when `ids` is exactly the current set of ids: no repeats, none missing, none extra. */
export function isSameSet(ids: string[], currentIds: string[]) {
  const given = new Set(ids);
  return (
    given.size === ids.length &&
    given.size === currentIds.length &&
    currentIds.every((id) => given.has(id))
  );
}
