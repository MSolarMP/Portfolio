import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { listSideQuests } from "@/modules/side-quests";
import { SideQuestsTable } from "./side-quests-table";

export const metadata: Metadata = { title: "Side quests" };

export default function SideQuestsAdmin() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title="Side quests"
        description="Hobbies on the About page. The order here is the order visitors see."
        action={{ href: "/admin/side-quests/new", label: "New side quest" }}
      />

      <Suspense fallback={<ContentSkeleton label="Loading side quests…" />}>
        <SideQuestsList />
      </Suspense>
    </div>
  );
}

async function SideQuestsList() {
  const rows = await listSideQuests();
  return (
    <SideQuestsTable
      // Remount only when rows are added or removed. A reorder re-renders this page too,
      // and remounting then would drop the table's focus and sort.
      key={rows
        .map((r) => r.id)
        .sort()
        .join()}
      initialRows={rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))}
    />
  );
}
