import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { DuplicateError, MissingReferenceError } from "@/lib/errors";

/**
 * Turns Prisma's known constraint errors into domain errors, so services can react
 * to "duplicate" or "missing reference" without importing Prisma. Rethrows the rest.
 */
export function translatePrismaError(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = err.meta?.target;
      throw new DuplicateError(Array.isArray(target) ? target.map(String) : []);
    }
    if (err.code === "P2003") {
      const field = err.meta?.field_name;
      throw new MissingReferenceError(typeof field === "string" ? field : null);
    }
  }
  throw err;
}
