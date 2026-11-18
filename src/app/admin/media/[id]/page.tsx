import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatBytes, formatDate } from "@/lib/format";
import { getMedia } from "@/server/content/media";
import { deleteMedia } from "../actions";
import { DetailsForm } from "../details-form";

export async function generateMetadata({
  params,
}: PageProps<"/admin/media/[id]">): Promise<Metadata> {
  const m = await getMedia((await params).id);
  return { title: m ? `${m.filename} · Media vault` : "Image not found" };
}

export default function MediaItem({ params, searchParams }: PageProps<"/admin/media/[id]">) {
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <Link href="/admin/media" className="-mb-5 self-start text-sm">
        ← Media vault
      </Link>
      <Suspense fallback={<ContentSkeleton label="Loading image…" />}>
        <Item params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Item({ params, searchParams }: PageProps<"/admin/media/[id]">) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const m = await getMedia(id);
  if (!m) notFound();

  const usedBy = [
    ...m.coverOf.map((i) => ({
      label: `Cover of “${i.title}”`,
      href: `/admin/side-quests/${i.id}`,
    })),
    ...m.diagramOf.map((q) => ({
      label: `Diagram in “${q.title}”`,
      href: `/admin/quests/${q.id}`,
    })),
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display min-w-0 text-2xl font-bold break-all">{m.filename}</h1>
        <DeleteButton
          action={deleteMedia.bind(null, m.id)}
          title={`Delete “${m.filename}”?`}
          description={
            usedBy.length
              ? `It's used ${usedBy.length} time${usedBy.length === 1 ? "" : "s"} (see “Used by”); those places will show no image. The original and every resized copy are deleted.`
              : "The original and every resized copy are deleted."
          }
          confirmLabel="Delete image"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4">
          {m.previewUrl && m.width && m.height && (
            <Image
              src={m.previewUrl}
              alt={m.alt ?? ""}
              width={m.width}
              height={m.height}
              unoptimized
              priority
              className="border-rule h-auto w-full rounded border bg-cover"
              style={m.blurData ? { backgroundImage: `url(${m.blurData})` } : undefined}
            />
          )}
          <DetailsForm
            id={m.id}
            justCreated={created === "1"}
            initial={{ alt: m.alt ?? "", caption: m.caption ?? "" }}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <section className="bg-vellum border-rule rounded border px-4 py-4">
            <h2 className="label-caps mb-2">File</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-faded">Size</dt>
              <dd className="tabular-nums">
                {m.width}×{m.height} · {m.bytes ? formatBytes(m.bytes) : "—"}
              </dd>
              <dt className="text-ink-faded">Type</dt>
              <dd>{m.mimeType}</dd>
              <dt className="text-ink-faded">Uploaded</dt>
              <dd>{formatDate(m.createdAt)}</dd>
            </dl>
          </section>

          <section className="bg-vellum border-rule rounded border px-4 py-4">
            <h2 className="label-caps mb-2">Used by</h2>
            {usedBy.length ? (
              <ul className="flex flex-col text-sm">
                {usedBy.map((u) => (
                  <li key={u.href}>
                    <Link href={u.href} className="inline-flex min-h-11 items-center">
                      {u.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-faded text-sm">Not used anywhere yet.</p>
            )}
          </section>

          <section className="bg-vellum border-rule rounded border px-4 py-4">
            <h2 className="label-caps mb-2">Public copies</h2>
            <ul className="flex flex-col text-sm">
              {m.files
                .sort((a, b) => a.format.localeCompare(b.format) || a.width - b.width)
                .map((f) => (
                  <li key={f.url}>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center font-mono text-xs"
                    >
                      {f.format.toUpperCase()} · {f.width}px ↗
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
