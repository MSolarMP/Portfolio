"use client";

import Link from "next/link";
import { type Column, DataTable } from "@/components/admin/data-table";
import { reorderChapters } from "./actions";

export type Row = {
  id: string;
  numeral: string;
  role: string;
  company: string;
  /** "2026-08" style, so server and browser print the same thing. */
  start: string;
  end: string | null;
  quests: number;
};

const monthName = new Intl.DateTimeFormat("en-ZA", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const show = (month: string) => monthName.format(new Date(`${month}-01T00:00:00Z`));

const columns: Column<Row>[] = [
  {
    key: "numeral",
    header: "№",
    className: "font-display font-bold",
    cell: (r) => r.numeral,
  },
  {
    key: "role",
    header: "Chapter",
    sortValue: (r) => r.company,
    cell: (r) => (
      <span className="flex flex-col">
        <Link
          href={`/admin/chronicle/${r.id}`}
          className="font-display inline-flex min-h-11 items-center font-bold"
        >
          {r.role}
        </Link>
        <span className="text-ink-faded -mt-2 text-sm">{r.company}</span>
      </span>
    ),
  },
  {
    key: "dates",
    header: "Dates",
    sortValue: (r) => r.start,
    className: "whitespace-nowrap tabular-nums",
    cell: (r) => (
      <>
        {show(r.start)} – {r.end ? show(r.end) : <b>present</b>}
      </>
    ),
  },
  {
    key: "quests",
    header: "Quests",
    sortValue: (r) => r.quests,
    className: "tabular-nums",
    cell: (r) => r.quests || <span className="text-ink-faded">0</span>,
  },
];

/** The Chronicle list: newest job first by default, reorderable by drag or ↑ ↓. */
export function ChronicleTable({ initialRows }: { initialRows: Row[] }) {
  return (
    <DataTable
      caption="Chronicle chapters"
      rows={initialRows}
      columns={columns}
      getId={(r) => r.id}
      getLabel={(r) => `${r.role}, ${r.company}`}
      onReorder={reorderChapters}
      empty={
        <>
          No chapters yet. <Link href="/admin/chronicle/new">Add your first job</Link>.
        </>
      }
    />
  );
}
