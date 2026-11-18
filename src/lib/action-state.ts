import type { z } from "zod";

/**
 * What every admin server action returns to `useActionState`.
 * `fieldErrors` keys match form field names, so `<FormField>` can show them inline.
 */
export type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string; at: number }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export const idle: ActionState = { status: "idle" };

export function success(message: string): ActionState {
  // `at` makes each result unique, so the form can react to repeat saves.
  return { status: "success", message, at: Date.now() };
}

/** First Zod issue per field, keyed by the field's top-level name. */
export function invalid(error: z.ZodError, message = "Check the highlighted fields."): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { status: "error", message, fieldErrors };
}
