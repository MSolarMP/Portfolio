import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { listQuests } from "@/server/content/quests";
import { QuestsTable } from "./quests-table";

export const metadata: Metadata = { title: "Quests" };

export default function QuestsAdmin() {
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title="Quests (case studies)"
        description="Client work and personal projects. The order here is the order visitors see."
        action={{ href: "/admin/quests/new", label: "New quest" }}
      />

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
