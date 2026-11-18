"use client";

import { useState, type ReactNode } from "react";

type Item = { slug: string; title: string; featured: boolean; card: ReactNode };

/**
 * Filter buttons over server-rendered cards. Without JavaScript every card simply shows.
 * Featured cards span the full width; the rest sit in a grid underneath.
 */
export function SideQuestFilter({ items }: { items: Item[] }) {
  const [active, setActive] = useState<string | null>(null);
  const visible = (item: Item) => active === null || item.slug === active;
  const featured = items.filter((i) => i.featured && visible(i));
  const rest = items.filter((i) => !i.featured && visible(i));
  const shown = featured.length + rest.length;

  const button = (slug: string | null, label: string) => (
    <button
      key={slug ?? "all"}
      type="button"
      aria-pressed={active === slug}
      onClick={() => setActive(slug)}
      className="border-rule bg-vellum text-ink hover:bg-vellum-light aria-pressed:border-leather aria-pressed:bg-leather aria-pressed:text-gold-thread font-display min-h-11 border px-4.5 text-sm font-bold tracking-wide"
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-7">
      {items.length > 1 && (
        <div className="flex flex-col gap-2">
          <div role="group" aria-label="Filter side quests" className="flex flex-wrap gap-2">
            {button(null, "All")}
            {items.map((item) => button(item.slug, item.title))}
          </div>
          <p aria-live="polite" className="sr-only">
            Showing {shown} of {items.length} side quests
          </p>
        </div>
      )}
      {featured.map((item) => (
        <div key={item.slug}>{item.card}</div>
      ))}
      {rest.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-6">
          {rest.map((item) => (
            <div key={item.slug} className="flex">
              {item.card}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
