"use client";

import { useId, useState, type ReactNode } from "react";

type Kind = "CLIENT" | "PERSONAL";
type Item = { slug: string; kind: Kind; stack: string[]; card: ReactNode };

const KINDS: { value: Kind | null; label: string }[] = [
  { value: null, label: "All quests" },
  { value: "CLIENT", label: "Guild contracts" },
  { value: "PERSONAL", label: "Personal forge" },
];

/**
 * Filters over server-rendered quest cards: by kind (buttons) and by technology (select).
 * Without JavaScript every card shows. Each control only appears when it can narrow the list.
 */
export function QuestFilter({ items }: { items: Item[] }) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [tech, setTech] = useState("");
  const selectId = useId();

  const stacks = [...new Set(items.flatMap((i) => i.stack))].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" }),
  );
  const hasBothKinds = new Set(items.map((i) => i.kind)).size > 1;
  const shown = items.filter(
    (i) => (kind === null || i.kind === kind) && (!tech || i.stack.includes(tech)),
  );

  return (
    <div className="flex flex-col gap-8">
      {(hasBothKinds || stacks.length > 1) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          {hasBothKinds ? (
            <div role="group" aria-label="Quest type" className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.label}
                  type="button"
                  aria-pressed={kind === k.value}
                  onClick={() => setKind(k.value)}
                  className="border-rule bg-vellum text-ink hover:bg-vellum-light aria-pressed:border-leather aria-pressed:bg-leather aria-pressed:text-gold-thread font-display min-h-11 border px-4.5 text-sm font-bold tracking-wide"
                >
                  {k.label}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          {stacks.length > 1 && (
            <div className="flex items-center gap-2.5">
              <label htmlFor={selectId} className="label-caps">
                Spell
              </label>
              <select
                id={selectId}
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                className="border-rule bg-vellum text-ink min-h-11 border px-3 font-sans text-[15px]"
              >
                <option value="">Any stack</option>
                {stacks.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      <p aria-live="polite" className="sr-only">
        Showing {shown.length} of {items.length} quests
      </p>
      {shown.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,330px),1fr))] gap-x-7 gap-y-8">
          {shown.map((i) => (
            <li key={i.slug}>{i.card}</li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-faded text-center">No quests match. Try another filter.</p>
      )}
    </div>
  );
}
