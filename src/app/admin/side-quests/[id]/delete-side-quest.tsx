"use client";

import { useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteInterest } from "../actions";

/** Delete button + confirmation. The action redirects back to the list. */
export function DeleteSideQuest({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  if (pending)
    return (
      <p className="text-ink-faded text-sm" aria-live="polite">
        Deleting…
      </p>
    );

  return (
    <ConfirmDialog
      triggerLabel="Delete"
      title={`Delete “${title}”?`}
      description="It disappears from the site straight away. Its albums and cover image stay in the Media vault."
      confirmLabel="Delete side quest"
      onConfirm={() =>
        startTransition(async () => {
          await deleteInterest(id);
        })
      }
    />
  );
}
