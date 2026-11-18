/**
 * The error body every /api/v1 endpoint returns: RFC 9457 "Problem Details",
 * served as `application/problem+json`. Shared by the server (to build it) and
 * the admin UI (to read it), so both sides agree on one shape.
 */
export type Problem = {
  /** Always "about:blank"; `code` carries the machine-readable reason. */
  type: string;
  /** Short, human-readable summary of the status, e.g. "Unprocessable Content". */
  title: string;
  status: number;
  /** What went wrong this time, safe to show to the user. */
  detail?: string;
  /** Stable machine-readable reason, e.g. "validation_failed", "slug_taken". */
  code: string;
  /** Also sent as the `X-Request-Id` header; quote it when reporting a problem. */
  requestId?: string;
  /** Field messages keyed by request-body field name (first message per field). */
  errors?: Record<string, string>;
};

export const PROBLEM_CONTENT_TYPE = "application/problem+json";
