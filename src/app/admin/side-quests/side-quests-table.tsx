"use client";

import Link from "next/link";
import { type Column, DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import type { Status } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/format";
import { reorderSideQuestsAction } from "@/modules/side-quests/side-quests.actions";

type Row = {
  id: string;
  title: string;
  slug: string;
  attribute: string | null;
  status: Status;
  featured: boolean;
  updatedAt: string; // ISO; formatted here so server and browser agree
};

const columns: Column<Row>[] = [
  {
    key: "title",
    header: "Title",
    sortValue: (r) => r.title,
    cell: (r) => (
      <span className="flex flex-col">
        <Link
          href={`/admin/side-quests/${r.id}`}
          className="font-display inline-flex min-h-11 items-center font-bold"
        >
          {r.title}
        </Link>
        <code className="text-ink-faded -mt-2 font-mono text-xs">/{r.slug}</code>
      </span>
    ),
  },
  {
    key: "attribute",
    header: "Attribute",
    sortValue: (r) => r.attribute ?? "",
    cell: (r) => r.attribute ?? <span className="text-ink-faded">—</span>,
  },
  {
    key: "status",
    header: "Status",
    sortValue: (r) => r.status,
    cell: (r) => <StatusBadge status={r.status} />,
  },
  {
    key: "featured",
    header: "Featured",
    sortValue: (r) => (r.featured ? 0 : 1),
    cell: (r) =>
      r.featured ? (
        <span className="text-bronze-text font-bold">
          <span aria-hidden="true">★ </span>Yes
        </span>
      ) : (
        <span className="text-ink-faded">No</span>
      ),
  },
  {
    key: "updated",
    header: "Updated",
    sortValue: (r) => -Date.parse(r.updatedAt), // ascending = newest first
    className: "whitespace-nowrap tabular-nums",
    cell: (r) => <time dateTime={r.updatedAt}>{formatDate(r.updatedAt)}</time>,
  },
];

/** The side quests list: sortable, and reorderable by drag or ↑ ↓. */
export function SideQuestsTable({ initialRows }: { initialRows: Row[] }) {
  return (
    <DataTable
      caption="Side quests"
      rows={initialRows}
      columns={columns}
      getId={(r) => r.id}
      getLabel={(r) => r.title}
      onReorder={reorderSideQuestsAction}
      empty={
        <>
          No side quests yet. <Link href="/admin/side-quests/new">Add the first one</Link>.
        </>
      }
    />
  );
}
