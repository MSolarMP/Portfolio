import type { Metadata } from "next";
import Link from "next/link";
import { listInterests } from "@/server/content/interests";
import { SideQuestsTable } from "./side-quests-table";

export const metadata: Metadata = { title: "Side quests" };

export default async function SideQuestsAdmin() {
  const rows = await listInterests();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-ink-faded text-sm">Content</span>
          <h1 className="font-display text-3xl font-bold">Side quests</h1>
          <p className="text-ink-faded">
            Hobbies on the About page. The order here is the order visitors see.
          </p>
        </div>
        <Link
          href="/admin/side-quests/new"
          className="bg-oxblood text-seal-text hover:bg-oxblood-dark hover:text-seal-text inline-flex min-h-11 items-center rounded px-4 font-sans font-bold"
        >
          New side quest
        </Link>
      </div>

      <SideQuestsTable
        // Remount only when rows are added or removed. A reorder re-renders this page too,
        // and remounting then would drop the table's focus and sort.
        key={rows
          .map((r) => r.id)
          .sort()
          .join()}
        initialRows={rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))}
      />
    </div>
  );
}
