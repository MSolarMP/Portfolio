import Link from "next/link";
import type { ActionState } from "@/lib/action-state";
import { Button } from "./button";

/**
 * The sticky Save row at the bottom of an editor form, with the save status announced
 * to screen readers. New records get "Create" + Cancel; existing ones Save + Revert.
 */
export function SaveBar({
  isNew,
  createLabel,
  cancelHref,
  dirty,
  pending,
  state,
  onRevert,
}: {
  isNew: boolean;
  createLabel: string;
  cancelHref: string;
  dirty: boolean;
  pending: boolean;
  state: ActionState;
  onRevert: () => void;
}) {
  return (
    <div className="bg-parchment/95 border-rule sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t px-1 py-3">
      <Button type="submit" disabled={pending || (!isNew && !dirty)}>
        {pending ? "Saving…" : isNew ? createLabel : "Save"}
      </Button>
      {isNew ? (
        <Link href={cancelHref} className="inline-flex min-h-11 items-center px-2">
          Cancel
        </Link>
      ) : (
        dirty &&
        !pending && (
          <Button variant="ghost" onClick={onRevert}>
            Revert
          </Button>
        )
      )}
      <p aria-live="polite" className="text-sm">
        {state.status === "error" ? (
          <span className="text-oxblood font-bold">{state.message}</span>
        ) : !isNew && dirty ? (
          <span className="text-ink-faded">Unsaved changes</span>
        ) : state.status === "success" ? (
          <span className="text-moss-text font-bold">{state.message}</span>
        ) : null}
      </p>
    </div>
  );
}
