import type { z } from "zod";
import { ConflictError, NotFoundError, UnavailableError, ValidationError } from "./errors";

/**
 * What every admin server action (controller) returns to `useActionState`.
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

/**
 * Turns a domain error from a service into form state: field errors for 409/422-style
 * problems, a message for a missing record. Anything else is a real failure and is rethrown.
 */
export function fromServiceError(err: unknown): ActionState {
  if (err instanceof ValidationError || err instanceof ConflictError) {
    return { status: "error", message: err.message, fieldErrors: err.errors };
  }
  if (err instanceof UnavailableError) return { status: "error", message: err.message };
  if (err instanceof NotFoundError) {
    return { status: "error", message: `${err.resource} no longer exists. Go back to the list.` };
  }
  throw err;
}
