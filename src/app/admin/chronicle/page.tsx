import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { dateToMonth } from "@/lib/schemas/chapter";
import { listChapters } from "@/server/content/chapters";
import { ChronicleTable } from "./chronicle-table";

export const metadata: Metadata = { title: "Chronicle" };

export default function ChronicleAdmin() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-ink-faded text-sm">Content</span>
          <h1 className="font-display text-3xl font-bold">Chronicle (experience)</h1>
          <p className="text-ink-faded">
            Your jobs, one chapter each. The order here is the order of the timeline.
          </p>
        </div>
        <Link
          href="/admin/chronicle/new"
          className="bg-oxblood text-seal-text hover:bg-oxblood-dark hover:text-seal-text inline-flex min-h-11 items-center rounded px-4 font-sans font-bold"
        >
          New chapter
        </Link>
      </div>

      <Suspense fallback={<ContentSkeleton label="Loading chapters…" />}>
        <ChapterList />
      </Suspense>
    </div>
  );
}

async function ChapterList() {
  const rows = await listChapters();
  return (
    <ChronicleTable
      // Remount only when rows are added or removed (a reorder keeps focus and sort).
      key={rows
        .map((r) => r.id)
        .sort()
        .join()}
      initialRows={rows.map((r) => ({
        id: r.id,
        numeral: r.numeral,
        role: r.role,
        company: r.company,
        start: dateToMonth(r.startDate),
        end: r.endDate ? dateToMonth(r.endDate) : null,
        quests: r._count.quests,
      }))}
    />
  );
}
