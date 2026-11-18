"use client";

import { useActionState, useState } from "react";
import { type ActionState, idle } from "@/lib/action-state";

/** The status to start with right after a create redirected here (`?created=1`). */
export function createdState(message = "Created."): ActionState {
  return { status: "success", message, at: 0 };
}

/**
 * Everything an admin editor form needs, in one place:
 *
 * - `values`: what's in the fields now; `saved`: what's in the database.
 * - `dirty`: they differ (compared after `normalise`, which mirrors what the server
 *   stores — trimming, cleaning rich text — so whitespace alone isn't "unsaved").
 * - `formAction` / `pending` / `state`: for `<form action>`; on success, `saved`
 *   becomes the normalised values.
 * - `errors`: field errors from the last save, keyed by field name.
 * - `revert()`: back to `saved`. It also bumps `revision`; use it as part of the `key`
 *   of uncontrolled children (rich-text editors) so they reset too.
 *
 * Fields are controlled so a failed save keeps what was typed.
 */
export function useEditorForm<V>({
  initial,
  normalise = (v) => v,
  submit,
  initialState = idle,
}: {
  initial: V;
  normalise?: (values: V) => V;
  submit: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initialState?: ActionState;
}) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [revision, setRevision] = useState(0);
  const dirty = JSON.stringify(normalise(values)) !== JSON.stringify(normalise(saved));

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await submit(prev, formData);
      if (result.status === "success") {
        const stored = normalise(values);
        setSaved(stored);
        setValues(stored);
      }
      return result;
    },
    initialState,
  );

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  /** Updates one field (for object-shaped values). */
  function set<K extends keyof V>(key: K, value: V[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function revert() {
    setValues(saved);
    setRevision((r) => r + 1);
  }

  return {
    values,
    setValues,
    set,
    saved,
    dirty,
    state,
    formAction,
    pending,
    errors,
    revert,
    revision,
  };
}
