"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/lib/action-state";
import { ConfirmDialog } from "./confirm-dialog";

/**
 * Delete + confirmation for one record. Pass a bound server action from the page,
 * e.g. `action={deleteQuest.bind(null, quest.id)}`; it redirects away on success.
 */
export function DeleteButton({
  action,
  title,
  description,
  confirmLabel,
}: {
  action: () => Promise<ActionState>;
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
