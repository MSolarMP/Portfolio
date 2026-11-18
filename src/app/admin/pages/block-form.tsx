"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/admin/button";
import { FormField, fieldClass } from "@/components/admin/form-field";
import { type ActionState, idle } from "@/lib/action-state";
import { updateContentTextAction } from "@/modules/content/content.actions";
import { CONTENT_TEXT_MAX } from "@/modules/content/content.schema";

type Block = { key: string; label: string; text: string };

/** Edits one line of site copy. Each block is its own small form with its own Save. */
export function BlockForm({ block }: { block: Block }) {
  // `saved` = what's in the database; `value` = what's in the box.
  const [saved, setSaved] = useState(block.text);
  const [value, setValue] = useState(block.text);
  const dirty = value !== saved;

  const [state, formAction, pending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      const result = await updateContentTextAction(block.key, { text: formData.get("text") });
      if (result.status === "success") {
        // The server trims the text, so mirror that here.
        const text = String(formData.get("text")).trim();
        setSaved(text);
        setValue((current) => (current.trim() === text ? text : current));
      }
      return result;
    },
    idle,
  );

  const textError = state.status === "error" ? state.fieldErrors?.text : undefined;
  const formError = state.status === "error" && !state.fieldErrors ? state.message : undefined;

  return (
    <form
      action={formAction}
      className="bg-vellum border-rule flex flex-col gap-3 rounded border px-4 py-4 sm:px-5"
    >
      <FormField
        label={block.label}
        error={textError}
        hint={
          <>
            <code className="font-mono text-xs">{block.key}</code> · {value.length}/
            {CONTENT_TEXT_MAX}
          </>
        }
      >
        {(field) => (
          <textarea
            {...field}
            name="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={CONTENT_TEXT_MAX}
            className={`${fieldClass} field-sizing-content min-h-11 font-serif text-base`}
          />
        )}
      </FormField>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!dirty || pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {dirty && !pending && (
          <Button variant="ghost" onClick={() => setValue(saved)}>
            Revert
          </Button>
        )}
        {/* Announced to screen readers when it changes. */}
        <p aria-live="polite" className="text-sm">
          {formError ? (
            <span className="text-oxblood font-bold">{formError}</span>
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
