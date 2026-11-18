import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { listCommendations } from "@/server/content/commendations";
import { CommendationsTable } from "./commendations-table";

export const metadata: Metadata = { title: "Commendations" };

export default function CommendationsAdmin() {
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-ink-faded text-sm">Content</span>
          <h1 className="font-display text-3xl font-bold">Commendations</h1>
          <p className="text-ink-faded">
            Recommendations copied from LinkedIn, each linking back to the original. The order here
            is the order visitors see.
          </p>
        </div>
        <Link
          href="/admin/commendations/new"
          className="bg-oxblood text-seal-text hover:bg-oxblood-dark hover:text-seal-text inline-flex min-h-11 items-center rounded px-4 font-sans font-bold"
        >
          New commendation
        </Link>
      </div>

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
