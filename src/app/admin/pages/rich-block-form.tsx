"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/admin/button";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { type ActionState, idle } from "@/lib/action-state";
import { type RichDoc, richTextKey } from "@/lib/rich-text";
import { updateContentRichAction } from "@/modules/content/content.actions";

type Block = { key: string; label: string; rich: RichDoc | null };

/** Edits one rich-text block of site copy. The rich-text twin of `BlockForm`. */
export function RichBlockForm({ block }: { block: Block }) {
  const initial = block.rich ? JSON.stringify(block.rich) : "";
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  // Bumped on Revert to remount the editor with the saved content.
  const [revision, setRevision] = useState(0);
  const dirty = richTextKey(value) !== richTextKey(saved);

  const [state, formAction, pending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      const raw = String(formData.get("rich") ?? "");
      const rich: unknown = raw ? JSON.parse(raw) : null;
      const result = await updateContentRichAction(block.key, { rich });
      if (result.status === "success") setSaved(String(formData.get("rich")));
      return result;
    },
    idle,
  );

  const error = state.status === "error" ? state.fieldErrors?.rich : undefined;

  return (
    <form
      action={formAction}
      className="bg-vellum border-rule flex flex-col gap-3 rounded border px-4 py-4 sm:px-5"
    >
      <RichTextEditor
        key={revision}
        name="rich"
        label={block.label}
        hint={<code className="font-mono text-xs">{block.key}</code>}
        error={error}
        initial={saved ? (JSON.parse(saved) as RichDoc) : null}
        onChange={setValue}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!dirty || pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {dirty && !pending && (
          <Button
            variant="ghost"
            onClick={() => {
              setValue(saved);
              setRevision((r) => r + 1);
            }}
          >
            Revert
          </Button>
        )}
        <p aria-live="polite" className="text-sm">
          {state.status === "error" && !error ? (
            <span className="text-oxblood font-bold">{state.message}</span>
          ) : dirty ? (
            <span className="text-ink-faded">Unsaved changes</span>
          ) : state.status === "success" ? (
            <span className="text-moss-text font-bold">Saved</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
