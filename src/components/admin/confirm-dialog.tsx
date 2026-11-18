"use client";

import { useId, useRef, type ReactNode } from "react";
import { Button } from "./button";

/**
 * Asks before a destructive action, using the browser's own <dialog>.
 * `showModal()` gives us focus trapping, Escape to close and a backdrop for free.
 * Cancel gets focus first, so pressing Enter by reflex never confirms.
 */
export function ConfirmDialog({
  triggerLabel,
  triggerAriaLabel,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
}: {
  triggerLabel: string;
  /** A fuller name for screen readers when the visible label is short, e.g. "Delete React". */
  triggerAriaLabel?: string;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <Button
        variant="secondary"
        aria-label={triggerAriaLabel}
        onClick={() => dialog.current?.showModal()}
      >
        {triggerLabel}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="bg-vellum-light border-bronze text-ink backdrop:bg-ink/50 m-auto max-w-md rounded border p-6"
      >
        <h2 id={titleId} className="font-display text-xl font-bold">
          {title}
        </h2>
        <div className="text-ink-faded mt-2">{description}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" autoFocus onClick={() => dialog.current?.close()}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              dialog.current?.close();
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
