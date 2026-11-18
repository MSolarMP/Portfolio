/**
 * Domain errors thrown by services. They say what went wrong in business terms;
 * the API layer (`src/server/api/handler.ts`) turns each one into an HTTP status.
 * Services never build HTTP responses themselves.
 */

/** The record doesn't exist (or isn't visible to this caller). → 404 */
export class NotFoundError extends Error {
  constructor(public readonly resource: string) {
    super(`${resource} not found.`);
    this.name = "NotFoundError";
  }
}

/** The request is well-formed but clashes with current state (slug taken, stale list). → 409 */
export class ConflictError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    /** Field-level messages, keyed like the request body, when one field is to blame. */
    public readonly errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ConflictError";
  }
}

/** Valid JSON that breaks a business rule (e.g. a cover image that no longer exists). → 422 */
export class ValidationError extends Error {
  constructor(
    public readonly errors: Record<string, string>,
    message = "Check the highlighted fields.",
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/** A unique constraint failed. Thrown by repositories so services never see Prisma errors. */
export class DuplicateError extends Error {
  constructor(public readonly fields: string[]) {
    super(`Duplicate value for ${fields.join(", ")}.`);
    this.name = "DuplicateError";
  }
}

/** A foreign key points at nothing (e.g. a deleted chapter). Thrown by repositories. */
export class MissingReferenceError extends Error {
  constructor(public readonly field: string | null) {
    super(`Referenced record not found${field ? ` (${field})` : ""}.`);
    this.name = "MissingReferenceError";
  }
}

/** An outside service (storage, email) failed; trying again later may work. → 503 */
export class UnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnavailableError";
  }
}

/** For pages: the result, or null when the service says the record doesn't exist (then call notFound()). */
export async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}
