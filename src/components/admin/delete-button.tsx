"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/lib/action-state";
import { ConfirmDialog } from "./confirm-dialog";

/**
 * Delete + confirmation for one record. Pass a bound server action,
 * e.g. `action={deleteQuestAction.bind(null, quest.id)}`. It either redirects away
 * or refreshes the page so the record disappears.
 */
export function DeleteButton({
  action,
  ariaLabel,
  title,
  description,
  confirmLabel,
}: {
  action: () => Promise<ActionState>;
  /** Accessible name for the trigger when "Delete" alone is ambiguous (e.g. in a table row). */
  ariaLabel?: string;
  title: string;
  description: string;
  confirmLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (pending) {
    return (
      <p className="text-ink-faded text-sm" aria-live="polite">
        Deleting…
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <ConfirmDialog
        triggerLabel="Delete"
        triggerAriaLabel={ariaLabel}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        onConfirm={() =>
          startTransition(async () => {
            const result = await action();
            if (result.status === "error") setError(result.message);
          })
        }
      />
      {error && (
        <p role="alert" className="text-oxblood text-sm font-bold">
          {error}
        </p>
      )}
    </div>
  );
}
