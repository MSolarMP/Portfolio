import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { dateToMonth } from "@/lib/schemas/chapter";
import { listChapters } from "@/server/content/chapters";
import { ChronicleTable } from "./chronicle-table";

export const metadata: Metadata = { title: "Chronicle" };

export default function ChronicleAdmin() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title="Chronicle (experience)"
        description="Your jobs, one chapter each. The order here is the order of the timeline."
        action={{ href: "/admin/chronicle/new", label: "New chapter" }}
      />

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
