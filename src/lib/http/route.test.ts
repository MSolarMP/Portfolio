import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ConflictError, DuplicateError, NotFoundError, ValidationError } from "@/lib/errors";
import { readJson } from "./body";
import { ApiError } from "@/lib/http/errors";
import { errorResponse, route } from "./route";

vi.mock("@/modules/auth/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => null) } },
  adminEmails: new Set(),
}));

const json = (res: Response) => res.json() as Promise<Record<string, unknown>>;

describe("errorResponse", () => {
  it("renders domain errors as RFC 9457 problem+json", async () => {
    const cases: [unknown, number, string][] = [
      [new ValidationError({ coverId: "Gone." }), 422, "validation_failed"],
      [new NotFoundError("Side quest"), 404, "not_found"],
      [new ConflictError("Taken.", "slug_taken", { slug: "Taken." }), 409, "slug_taken"],
      [new DuplicateError(["slug"]), 409, "duplicate"],
      [new ApiError(415, "unsupported_media_type"), 415, "unsupported_media_type"],
    ];
    for (const [err, status, code] of cases) {
      const res = errorResponse(err, "req-1");
      expect(res.status).toBe(status);
      expect(res.headers.get("content-type")).toBe("application/problem+json");
      expect(await json(res)).toMatchObject({
        type: "about:blank",
        status,
        code,
        requestId: "req-1",
      });
    }
  });

  it("passes field errors through", async () => {
    const body = await json(errorResponse(new ValidationError({ coverId: "Gone." }), "r"));
    expect(body.errors).toEqual({ coverId: "Gone." });
  });

  it("hides the details of unexpected errors", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = errorResponse(new Error("db password is hunter2"), "req-2");
    expect(res.status).toBe(500);
    expect(JSON.stringify(await json(res))).not.toContain("hunter2");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("route()", () => {
  const ctx = { params: Promise.resolve({}) };

  it("adds X-Request-Id to every response", async () => {
    const handler = route("public", async () => Response.json({ data: 1 }));
    const res = await handler(new NextRequest("http://localhost/api/v1/x"), ctx);
    expect(res.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects an unsafe request without an Origin header", async () => {
    const handler = route("public", async () => new Response(null, { status: 204 }));
    const res = await handler(
      new NextRequest("http://localhost/api/v1/x", { method: "POST" }),
      ctx,
    );
    expect(res.status).toBe(403);
  });

  it("allows a same-origin unsafe request on a public route", async () => {
    const handler = route("public", async () => new Response(null, { status: 204 }));
    const res = await handler(
      new NextRequest("http://localhost/api/v1/x", {
        method: "POST",
        headers: { origin: "http://localhost" },
      }),
      ctx,
    );
    expect(res.status).toBe(204);
  });
});

describe("readJson", () => {
  const schema = z.object({ name: z.string().min(1, "Name it.") });
  const req = (body: string, type = "application/json") =>
    new Request("http://localhost/", { method: "POST", headers: { "content-type": type }, body });

  it("returns the parsed body", async () => {
    await expect(readJson(req('{"name":"a"}'), schema)).resolves.toEqual({ name: "a" });
  });

  it("415 for a non-JSON content type", async () => {
    await expect(readJson(req("name=a", "text/plain"), schema)).rejects.toMatchObject({
      status: 415,
    });
  });

  it("400 for malformed JSON", async () => {
    await expect(readJson(req("{nope"), schema)).rejects.toMatchObject({ status: 400 });
  });

  it("422 with field errors when the schema fails", async () => {
    await expect(readJson(req('{"name":""}'), schema)).rejects.toMatchObject({
      status: 422,
      extra: { errors: { name: "Name it." } },
    });
  });

  it("413 for an oversized body", async () => {
    const big = JSON.stringify({ name: "x".repeat(1_100_000) });
    await expect(readJson(req(big), schema)).rejects.toMatchObject({ status: 413 });
  });
});
