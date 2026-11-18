"use client";

import Link from "next/link";
import { type Column, DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import type { Status } from "@/generated/prisma/enums";
import { excerpt, formatDate } from "@/lib/format";
import { reorderCommendationsAction } from "@/modules/commendations/commendations.actions";

type Row = {
  id: string;
  name: string;
  headline: string | null;
  quote: string;
  givenOn: string | null; // ISO
  status: Status;
  featured: boolean;
};

const columns: Column<Row>[] = [
  {
    key: "name",
    header: "From",
    sortValue: (r) => r.name,
    cell: (r) => (
      <span className="flex flex-col">
        <Link
          href={`/admin/commendations/${r.id}`}
          className="font-display inline-flex min-h-11 items-center font-bold"
        >
          {r.name}
        </Link>
        {r.headline && <span className="text-ink-faded -mt-2 text-sm">{r.headline}</span>}
      </span>
    ),
  },
  {
    key: "quote",
    header: "Quote",
    cell: (r) => <q className="text-ink-faded font-serif italic">{excerpt(r.quote)}</q>,
  },
  {
    key: "given",
    header: "Given",
    sortValue: (r) => (r.givenOn ? -Date.parse(r.givenOn) : 0), // ascending = newest first
    className: "whitespace-nowrap tabular-nums",
    cell: (r) =>
      r.givenOn ? (
        <time dateTime={r.givenOn.slice(0, 10)}>{formatDate(r.givenOn)}</time>
      ) : (
        <span className="text-ink-faded">—</span>
      ),
  },
  {
    key: "status",
    header: "Status",
    sortValue: (r) => r.status,
    cell: (r) => (
      <span className="flex flex-col items-start gap-1">
        <StatusBadge status={r.status} />
        {r.featured && (
          <span className="text-bronze-text text-xs font-bold">
            <span aria-hidden="true">★ </span>Featured
          </span>
        )}
      </span>
    ),
  },
];

/** The commendations list: sortable, and reorderable by drag or ↑ ↓. */
export function CommendationsTable({ initialRows }: { initialRows: Row[] }) {
  return (
    <DataTable
      caption="Commendations"
      rows={initialRows}
      columns={columns}
      getId={(r) => r.id}
      getLabel={(r) => `${r.name}'s commendation`}
      onReorder={reorderCommendationsAction}
      empty={
        <>
          No commendations yet. <Link href="/admin/commendations/new">Add one from LinkedIn</Link>.
        </>
      }
    />
  );
}
