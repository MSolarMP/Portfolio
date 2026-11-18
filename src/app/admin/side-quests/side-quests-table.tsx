"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { type Column, DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import type { Status } from "@/generated/prisma/enums";
import { type ActionState, idle } from "@/lib/action-state";
import { reorderInterests } from "./actions";

export type Row = {
  id: string;
  title: string;
  slug: string;
  attribute: string | null;
  status: Status;
  featured: boolean;
  updatedAt: string; // ISO; formatted here so server and browser agree
};

// Fixed locale and zone so the server render and hydration print the same date.
const date = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Johannesburg",
});

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
    cell: (r) => <time dateTime={r.updatedAt}>{date.format(new Date(r.updatedAt))}</time>,
  },
];

/** The side quests list. Reordering updates the screen at once, then saves; a failed save puts it back. */
export function SideQuestsTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [state, setState] = useState<ActionState>(idle);
  const [pending, startTransition] = useTransition();

  function reorder(ids: string[]) {
    const before = rows;
    const byId = new Map(rows.map((r) => [r.id, r]));
    setRows(ids.flatMap((id) => byId.get(id) ?? []));
    startTransition(async () => {
      const result = await reorderInterests(ids);
      if (result.status === "error") setRows(before);
      setState(result);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <DataTable
        caption="Side quests"
        rows={rows}
        columns={columns}
        getId={(r) => r.id}
        getLabel={(r) => r.title}
        onReorder={reorder}
        empty={
          <>
            No side quests yet. <Link href="/admin/side-quests/new">Add the first one</Link>.
          </>
        }
      />
      <p aria-live="polite" className="min-h-6 text-sm">
        {pending ? (
          <span className="text-ink-faded">Saving order…</span>
        ) : state.status === "error" ? (
          <span className="text-oxblood font-bold">{state.message}</span>
        ) : state.status === "success" ? (
          <span className="text-moss-text font-bold">{state.message}</span>
        ) : null}
      </p>
    </div>
  );
}
