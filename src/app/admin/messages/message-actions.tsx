"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/admin/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { type ActionState, idle } from "@/lib/action-state";
import { deleteMessage, setMessageArchived, setMessageRead } from "./actions";

/**
 * Buttons for one message. Opening an unread message marks it read once, from the
 * browser after it's shown, so a link prefetch can never mark it read by accident.
 */
export function MessageActions({
  id,
  name,
  read,
  archived,
}: {
  id: string;
  name: string;
  read: boolean;
  archived: boolean;
}) {
  const [state, setState] = useState<ActionState>(idle);
  const [pending, startTransition] = useTransition();
  const markedOnOpen = useRef(false);

  useEffect(() => {
    if (read || markedOnOpen.current) return;
    markedOnOpen.current = true;
    startTransition(async () => {
      await setMessageRead(id, true);
    });
  }, [id, read]);

  function run(action: () => Promise<ActionState>) {
    startTransition(async () => setState(await action()));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => run(() => setMessageArchived(id, !archived))}
      >
        {archived ? "Move to inbox" : "Archive"}
      </Button>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() => run(() => setMessageRead(id, !read))}
      >
        {read ? "Mark unread" : "Mark read"}
      </Button>
      <DeleteButton
        action={deleteMessage.bind(null, id)}
        title={`Delete the message from ${name}?`}
        description="It's gone for good. Archive it instead if you might want it later."
        confirmLabel="Delete message"
      />
      <p aria-live="polite" className="text-sm">
        {state.status === "success" && !pending ? (
          <span className="text-moss-text font-bold">{state.message}</span>
        ) : null}
      </p>
    </div>
  );
}
