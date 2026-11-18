import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/db";

/** Site settings (`SiteSetting` rows: key → JSON value). Prisma queries only. */

export function findByKeys(keys: string[]) {
  return db.siteSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
}

/** Writes each key in one transaction. `null` is stored as JSON null (the column is NOT NULL). */
export async function upsertMany(values: Record<string, unknown>) {
  const json = (v: unknown) => (v === null ? Prisma.JsonNull : (v as Prisma.InputJsonValue));
  await db.$transaction(
    Object.entries(values).map(([key, value]) =>
      db.siteSetting.upsert({
        where: { key },
        create: { key, value: json(value) },
        update: { value: json(value) },
      }),
    ),
  );
}
