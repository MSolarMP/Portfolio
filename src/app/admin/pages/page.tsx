import type { Metadata } from "next";
import { listContentBlocks } from "@/server/content/content-blocks";
import { BlockForm } from "./block-form";

export const metadata: Metadata = { title: "Pages & copy" };

export default async function PagesAdmin() {
  const blocks = await listContentBlocks();

  const pages = new Map<string, typeof blocks>();
  for (const b of blocks) pages.set(b.page, [...(pages.get(b.page) ?? []), b]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <span className="text-ink-faded text-sm">Content</span>
        <h1 className="font-display text-3xl font-bold">Pages & copy</h1>
        <p className="text-ink-faded">
          Every line of text on the public site. Saving a block refreshes only its page.
        </p>
      </div>

      {pages.size === 0 ? (
        <p className="bg-vellum border-rule rounded border px-5 py-4">
          No content blocks yet. Run <code className="font-mono">npm run db:seed</code> to add the
          starter copy.
        </p>
      ) : (
        <>
          <nav aria-label="Pages" className="flex flex-wrap gap-2">
            {[...pages.keys()].map((page) => (
              <a
                key={page}
                href={`#page-${page}`}
                className="border-rule bg-vellum text-ink hover:bg-aged hover:text-ink inline-flex min-h-11 items-center rounded border px-4 capitalize"
              >
                {page}
              </a>
            ))}
          </nav>

          {[...pages].map(([page, list]) => (
            <section
              key={page}
              id={`page-${page}`}
              aria-labelledby={`page-${page}-title`}
              className="flex scroll-mt-6 flex-col gap-3"
            >
              <h2 id={`page-${page}-title`} className="label-caps">
                {page} <span className="text-ink-faded">· {list.length}</span>
              </h2>
              {list.map((b) =>
                b.type === "TEXT" ? (
                  <BlockForm
                    key={b.key}
                    block={{ key: b.key, label: b.label, text: b.text ?? "" }}
                  />
                ) : (
                  <p key={b.key} className="bg-vellum border-rule rounded border px-5 py-4">
                    <b>{b.label}</b> is rich text. It will be editable once the rich-text editor
                    lands with Quests.
                  </p>
                ),
              )}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
