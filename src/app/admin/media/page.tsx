import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { formatBytes } from "@/lib/format";
import { listMedia } from "@/server/content/media";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Media vault" };

export default function MediaVault() {
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title="Media vault"
        description="Images for the site: your profile photo, project screenshots, diagrams and covers. Each upload is resized to AVIF and WebP; the original stays private."
      />

      <UploadForm />

      <Suspense fallback={<ContentSkeleton label="Loading images…" />}>
        <Grid />
      </Suspense>
    </div>
  );
}

async function Grid() {
  const items = await listMedia();

  if (items.length === 0) {
    return (
      <p className="bg-vellum border-rule rounded border px-5 py-4">
        The vault is empty. Upload your first image above.
      </p>
    );
  }

  return (
    <section aria-labelledby="vault-title" className="flex flex-col gap-3">
      <h2 id="vault-title" className="label-caps">
        All images <span className="text-ink-faded">· {items.length}</span>
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {items.map((m) => (
          <li key={m.id}>
            <Link
              href={`/admin/media/${m.id}`}
              className="bg-vellum border-rule hover:border-bronze text-ink hover:text-ink flex h-full flex-col overflow-hidden rounded border"
            >
              <span
                className="bg-aged relative block aspect-[4/3] bg-cover bg-center"
                // The blurred preview shows until the thumbnail arrives.
                style={m.blurData ? { backgroundImage: `url(${m.blurData})` } : undefined}
              >
                {m.thumbUrl && (
                  <Image
                    src={m.thumbUrl}
                    alt={m.alt ?? ""}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    // Already resized and compressed by us; no need for Next to do it again.
                    unoptimized
                    className="object-cover"
                  />
                )}
              </span>
              <span className="flex flex-col gap-0.5 px-3 py-2 text-sm">
                <span className="truncate font-bold">{m.filename}</span>
                <span className="text-ink-faded tabular-nums">
                  {m.width}×{m.height} · {m.bytes ? formatBytes(m.bytes) : "—"}
                </span>
                {!m.alt && <span className="text-oxblood text-xs font-bold">Needs alt text</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
