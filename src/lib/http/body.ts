import "server-only";
import type { z } from "zod";
import { ApiError, fieldErrors } from "@/lib/http/errors";

/** JSON bodies are small (the biggest is a quest with seven rich-text sections). */
const MAX_JSON_BYTES = 1_000_000;

/**
 * Reads and validates a JSON request body against `schema`.
 * 415 if it isn't JSON, 413 if it's too big, 400 if it doesn't parse,
 * 422 with field errors if it doesn't match the schema.
 */
export async function readJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.output<S>> {
  const type = req.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(type)) {
    throw new ApiError(415, "unsupported_media_type", "Send the body as application/json.");
  }
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_JSON_BYTES) throw tooLarge();

  const text = await req.text();
  if (text.length > MAX_JSON_BYTES) throw tooLarge();

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiError(400, "invalid_json", "The request body isn't valid JSON.");
  }

  const parsed = await schema.safeParseAsync(json);
  if (!parsed.success) {
    throw new ApiError(422, "validation_failed", "Check the highlighted fields.", {
      errors: fieldErrors(parsed.error),
    });
  }
  return parsed.data;
}

function tooLarge() {
  return new ApiError(413, "payload_too_large", "The request body is too large.");
}
