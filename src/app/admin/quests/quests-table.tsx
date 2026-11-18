"use client";

import Link from "next/link";
import { type Column, DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import type { QuestKind, Rarity, Status } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/format";
import { RARITY_LABELS } from "./labels";
import { reorderQuestsAction } from "@/modules/quests/quests.actions";

type Row = {
  id: string;
  title: string;
  slug: string;
  client: string | null;
  kind: QuestKind;
  rarity: Rarity;
  status: Status;
  featured: boolean;
  updatedAt: string; // ISO
};

const rarityRank: Record<Rarity, number> = { LEGENDARY: 0, EPIC: 1, RARE: 2 };

const columns: Column<Row>[] = [
  {
    key: "title",
    header: "Title",
    sortValue: (r) => r.title,
    cell: (r) => (
      <span className="flex flex-col">
        <Link
          href={`/admin/quests/${r.id}`}
          className="font-display inline-flex min-h-11 items-center font-bold"
        >
          {r.title}
        </Link>
        <code className="text-ink-faded -mt-2 font-mono text-xs">/quests/{r.slug}</code>
      </span>
    ),
  },
  {
    key: "client",
    header: "Client",
    sortValue: (r) => r.client ?? "",
    cell: (r) =>
      r.kind === "PERSONAL" ? (
        <span className="text-ink-faded italic">Personal</span>
      ) : (
        (r.client ?? <span className="text-ink-faded">—</span>)
      ),
  },
  {
    key: "rarity",
    header: "Rarity",
    sortValue: (r) => rarityRank[r.rarity],
    cell: (r) => RARITY_LABELS[r.rarity],
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

/** The quests list: sortable, and reorderable by drag or ↑ ↓. */
export function QuestsTable({ initialRows }: { initialRows: Row[] }) {
  return (
    <DataTable
      caption="Quests"
      rows={initialRows}
      columns={columns}
      getId={(r) => r.id}
      getLabel={(r) => r.title}
      onReorder={reorderQuestsAction}
      empty={
        <>
          No quests yet. <Link href="/admin/quests/new">Write the first one</Link>.
        </>
      }
    />
  );
}
