import "server-only";
import type { z } from "zod";

const TITLES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  409: "Conflict",
  413: "Content Too Large",
  415: "Unsupported Media Type",
  422: "Unprocessable Content",
  429: "Too Many Requests",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

export function statusTitle(status: number) {
  return TITLES[status] ?? "Error";
}

/** An HTTP-level failure raised inside a route handler. The handler wrapper renders it. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    detail?: string,
    public readonly extra: {
      errors?: Record<string, string>;
      headers?: Record<string, string>;
    } = {},
  ) {
    super(detail ?? statusTitle(status));
    this.name = "ApiError";
  }
}

/** First Zod issue per top-level field, keyed by that field's name ("form" for the whole body). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}
