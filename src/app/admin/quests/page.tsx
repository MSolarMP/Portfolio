import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { listQuests } from "@/server/content/quests";
import { QuestsTable } from "./quests-table";

export const metadata: Metadata = { title: "Quests" };

export default function QuestsAdmin() {
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-ink-faded text-sm">Content</span>
          <h1 className="font-display text-3xl font-bold">Quests (case studies)</h1>
          <p className="text-ink-faded">
            Client work and personal projects. The order here is the order visitors see.
          </p>
        </div>
        <Link
          href="/admin/quests/new"
          className="bg-oxblood text-seal-text hover:bg-oxblood-dark hover:text-seal-text inline-flex min-h-11 items-center rounded px-4 font-sans font-bold"
        >
          New quest
        </Link>
      </div>

      <Suspense fallback={<ContentSkeleton label="Loading quests…" />}>
        <QuestsList />
      </Suspense>
    </div>
  );
}

async function QuestsList() {
  const rows = await listQuests();
  return (
    <QuestsTable
      // Remount only when rows are added or removed (a reorder keeps focus and sort).
      key={rows
        .map((r) => r.id)
        .sort()
        .join()}
      initialRows={rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))}
    />
  );
}
