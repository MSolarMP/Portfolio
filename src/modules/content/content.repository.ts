import "server-only";
import type { RichDoc } from "@/lib/rich-text";
import { db, jsonOrNull } from "@/db";

/** Page copy (`ContentBlock` rows). Prisma queries only. */

export function findAll() {
  return db.contentBlock.findMany({ orderBy: [{ page: "asc" }, { order: "asc" }] });
}

export function findTextByPage(page: string) {
  return db.contentBlock.findMany({
    where: { page, type: "TEXT" },
    select: { key: true, text: true },
  });
}

export function findMeta(key: string) {
  return db.contentBlock.findUnique({
    where: { key },
    select: { page: true, type: true, label: true },
  });
}

export function setText(key: string, text: string) {
  return db.contentBlock.update({ where: { key }, data: { text } });
}

export function setRich(key: string, rich: RichDoc | null) {
  return db.contentBlock.update({ where: { key }, data: { rich: jsonOrNull(rich) } });
}
