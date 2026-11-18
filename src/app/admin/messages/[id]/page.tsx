import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { formatDateTime } from "@/lib/format";
import { replyHref } from "@/lib/reply";
import { getMessage } from "@/server/content/messages";
import { MessageActions } from "../message-actions";

export const metadata: Metadata = { title: "Raven" };

export default function MessagePage({ params }: PageProps<"/admin/messages/[id]">) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/messages" className="-mb-5 self-start text-sm">
        ← Ravens
      </Link>
      <Suspense fallback={<ContentSkeleton label="Loading message…" />}>
        <Message params={params} />
      </Suspense>
    </div>
  );
}

async function Message({ params }: Pick<PageProps<"/admin/messages/[id]">, "params">) {
  const m = await getMessage((await params).id);
  if (!m) notFound();

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-ink-faded text-sm">
          <time dateTime={m.createdAt.toISOString()}>{formatDateTime(m.createdAt)}</time>
          {m.archivedAt && " · Archived"}
        </span>
        <h1 className="font-display text-2xl font-bold wrap-break-word">{m.purpose}</h1>
      </div>

      <article className="bg-vellum border-rule flex flex-col gap-4 rounded border px-4 py-5 sm:px-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-faded">From</dt>
          <dd className="font-bold break-words">{m.name}</dd>
          <dt className="text-ink-faded">Email</dt>
          <dd className="break-all">{m.email}</dd>
          {m.company && (
            <>
              <dt className="text-ink-faded">Company</dt>
              <dd className="break-words">{m.company}</dd>
            </>
          )}
        </dl>
        {/* Plain text only: whatever a visitor typed is shown, never run as HTML. */}
        <p className="border-rule-faint border-t pt-4 font-serif text-lg break-words whitespace-pre-wrap">
          {m.body}
        </p>
      </article>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={replyHref(m)}
          className="bg-oxblood text-seal-text hover:bg-oxblood-dark hover:text-seal-text inline-flex min-h-11 items-center rounded px-4 font-sans font-bold"
        >
          Reply by email
        </a>
        <MessageActions
          // Keyed by message only: it must stay mounted when read/archived change, so
          // "mark read on open" runs once and "Mark unread" isn't undone straight away.
          key={m.id}
          id={m.id}
          name={m.name}
          read={Boolean(m.readAt)}
          archived={Boolean(m.archivedAt)}
        />
      </div>
    </>
  );
}
