"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Makes the column sortable. Return what to compare by. */
  sortValue?: (row: T) => string | number;
  className?: string;
};

type Sort = { key: string; dir: "asc" | "desc" } | null;

/**
 * An admin table. Columns with `sortValue` sort when you click their header.
 * Pass `onReorder` to let rows be dragged (mouse) or moved with the ↑ ↓ buttons
 * (keyboard, touch, screen readers). Reordering is only offered while unsorted,
 * because "move up" means nothing in a sorted view.
 *
 * The parent owns the order: `onReorder` receives every id, top to bottom.
 */
export function DataTable<T>({
  caption,
  rows,
  columns,
  getId,
  getLabel,
  onReorder,
  empty,
}: {
  caption: string;
  rows: T[];
  columns: Column<T>[];
  getId: (row: T) => string;
  /** Names a row in announcements and button labels, e.g. its title. */
  getLabel: (row: T) => string;
  onReorder?: (ids: string[]) => void;
  empty?: ReactNode;
}) {
  const [sort, setSort] = useState<Sort>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  // After a keyboard move, put focus back on the button that was pressed.
  const [refocus, setRefocus] = useState<{ id: string; dir: "up" | "down" } | null>(null);
  const tbody = useRef<HTMLTableSectionElement>(null);

  const reorderable = Boolean(onReorder) && sort === null && rows.length > 1;

  const shown = sort ? sortRows(rows, columns, sort) : rows;

  useEffect(() => {
    if (!refocus || !tbody.current) return;
    const find = (dir: string) =>
      tbody.current?.querySelector<HTMLButtonElement>(
        `[data-move="${CSS.escape(refocus.id)}:${dir}"]:not(:disabled)`,
      );
    // At the top or bottom the pressed button is disabled, so use the other one.
    (find(refocus.dir) ?? find(refocus.dir === "up" ? "down" : "up"))?.focus();
    setRefocus(null);
  }, [refocus]);

  function move(from: number, to: number) {
    if (!onReorder || from === to || to < 0 || to >= rows.length) return;
    const ids = rows.map(getId);
    const [id] = ids.splice(from, 1);
    ids.splice(to, 0, id);
    onReorder(ids);
    setAnnouncement(`${getLabel(rows[from])} moved to position ${to + 1} of ${rows.length}.`);
  }

  function toggleSort(key: string) {
    setSort((s) =>
      s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null,
    );
  }

  function onDragOver(e: DragEvent, index: number) {
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  }

  function onDrop(e: DragEvent, index: number) {
    e.preventDefault();
    const from = rows.findIndex((r) => getId(r) === dragId);
    if (from !== -1) move(from, index);
    setDragId(null);
    setOverIndex(null);
  }

  if (rows.length === 0) {
    return <div className="bg-vellum border-rule rounded border px-5 py-4">{empty}</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="border-rule overflow-x-auto rounded border">
        <table className="bg-vellum w-full border-collapse text-left">
          <caption className="sr-only">
            {caption}
            {reorderable && ". Drag a row or use its move buttons to change the order."}
          </caption>
          <thead className="bg-aged/60 border-rule border-b">
            <tr>
              {reorderable && (
                <th scope="col" className="w-0 px-2 py-2">
                  <span className="sr-only">Order</span>
                </th>
              )}
              {columns.map((col) => {
                const active = sort?.key === col.key ? sort.dir : null;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      active === "asc" ? "ascending" : active === "desc" ? "descending" : undefined
                    }
                    className={`label-caps px-3 py-2 ${col.className ?? ""}`}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="hover:text-oxblood -mx-1 inline-flex min-h-11 items-center gap-1 px-1"
                      >
                        {col.header}
                        <span aria-hidden="true" className="w-3 text-xs">
                          {active === "asc" ? "▲" : active === "desc" ? "▼" : ""}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody ref={tbody}>
            {shown.map((row, index) => {
              const id = getId(row);
              const label = getLabel(row);
              return (
                <tr
                  key={id}
                  draggable={reorderable}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", label);
                    setDragId(id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverIndex(null);
                  }}
                  onDragOver={reorderable ? (e) => onDragOver(e, index) : undefined}
                  onDrop={reorderable ? (e) => onDrop(e, index) : undefined}
                  className={`border-rule-faint border-b last:border-b-0 ${
                    dragId === id ? "opacity-50" : ""
                  } ${
                    overIndex === index && dragId !== id
                      ? "shadow-[inset_0_3px_0_var(--color-oxblood)]"
                      : ""
                  }`}
                >
                  {reorderable && (
                    <td className="px-2 py-1 whitespace-nowrap">
                      <span
                        aria-hidden="true"
                        title="Drag to reorder"
                        className="text-ink-faded inline-block cursor-grab px-1 select-none"
                      >
                        ⠿
                      </span>
                      <MoveButton
                        id={id}
                        dir="up"
                        label={`Move ${label} up`}
                        disabled={index === 0}
                        onClick={() => {
                          move(index, index - 1);
                          setRefocus({ id, dir: "up" });
                        }}
                      />
                      <MoveButton
                        id={id}
                        dir="down"
                        label={`Move ${label} down`}
                        disabled={index === rows.length - 1}
                        onClick={() => {
                          move(index, index + 1);
                          setRefocus({ id, dir: "down" });
                        }}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3 py-2 ${col.className ?? ""}`}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {onReorder && sort && rows.length > 1 && (
        <p className="text-ink-faded text-sm">
          Sorted by {columns.find((c) => c.key === sort.key)?.header.toLowerCase()}.{" "}
          <button
            type="button"
            onClick={() => setSort(null)}
            className="text-oxblood hover:text-oxblood-dark min-h-11 font-bold underline"
          >
            Clear sort
          </button>{" "}
          to change the display order.
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

function MoveButton({
  id,
  dir,
  label,
  disabled,
  onClick,
}: {
  id: string;
  dir: "up" | "down";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-move={`${id}:${dir}`}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="text-ink hover:bg-aged inline-flex h-11 w-11 items-center justify-center rounded disabled:opacity-30"
    >
      <span aria-hidden="true">{dir === "up" ? "↑" : "↓"}</span>
    </button>
  );
}

function sortRows<T>(rows: T[], columns: Column<T>[], sort: NonNullable<Sort>) {
  const value = columns.find((c) => c.key === sort.key)?.sortValue;
  if (!value) return rows;
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    const cmp =
      typeof x === "string" && typeof y === "string"
        ? x.localeCompare(y, undefined, { sensitivity: "base", numeric: true })
        : Number(x) - Number(y);
    return cmp * sign;
  });
}
