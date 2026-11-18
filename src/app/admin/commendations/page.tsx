import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { listCommendations } from "@/modules/commendations";
import { CommendationsTable } from "./commendations-table";

export const metadata: Metadata = { title: "Commendations" };

export default function CommendationsAdmin() {
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title="Commendations"
        description="Recommendations copied from LinkedIn, each linking back to the original. The order here is the order visitors see."
        action={{ href: "/admin/commendations/new", label: "New commendation" }}
      />

      <Suspense fallback={<ContentSkeleton label="Loading commendations…" />}>
        <CommendationList />
      </Suspense>
    </div>
  );
}

async function CommendationList() {
  const rows = await listCommendations();
  return (
    <CommendationsTable
      // Remount only when rows are added or removed (a reorder keeps focus and sort).
      key={rows
        .map((r) => r.id)
        .sort()
        .join()}
      initialRows={rows.map((r) => ({ ...r, givenOn: r.givenOn?.toISOString() ?? null }))}
    />
  );
}
