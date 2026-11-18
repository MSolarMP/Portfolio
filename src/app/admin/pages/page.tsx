import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { readRichDoc } from "@/lib/rich-text";
import { listContentBlocks } from "@/server/content/content-blocks";
import { BlockForm } from "./block-form";
import { RichBlockForm } from "./rich-block-form";

export const metadata: Metadata = { title: "Pages & copy" };

export default function PagesAdmin() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title="Pages & copy"
        description="Every line of text on the public site. Saving a block refreshes only its page."
      />

      <Suspense fallback={<ContentSkeleton label="Loading page copy…" />}>
        <Blocks />
      </Suspense>
    </div>
  );
}

async function Blocks() {
  const blocks = await listContentBlocks();

  const pages = new Map<string, typeof blocks>();
  for (const b of blocks) pages.set(b.page, [...(pages.get(b.page) ?? []), b]);

  return pages.size === 0 ? (
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
              <BlockForm key={b.key} block={{ key: b.key, label: b.label, text: b.text ?? "" }} />
            ) : (
              <RichBlockForm
                key={b.key}
                block={{ key: b.key, label: b.label, rich: readRichDoc(b.rich) }}
              />
            ),
          )}
        </section>
      ))}
    </>
  );
}
