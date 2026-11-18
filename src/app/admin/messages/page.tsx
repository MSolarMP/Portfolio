import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { excerpt, formatDate } from "@/lib/format";
import { countMessages, listMessages, type MessageView } from "@/server/content/messages";

export const metadata: Metadata = { title: "Ravens" };

export default function MessagesAdmin({ searchParams }: PageProps<"/admin/messages">) {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <span className="text-ink-faded text-sm">Inbox</span>
        <h1 className="font-display text-3xl font-bold">Ravens (messages)</h1>
        <p className="text-ink-faded">Messages sent through the contact form on the site.</p>
      </div>

      <Suspense fallback={<ContentSkeleton label="Loading messages…" />}>
        <Inbox searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inbox({ searchParams }: Pick<PageProps<"/admin/messages">, "searchParams">) {
  const view: MessageView = (await searchParams).view === "archived" ? "archived" : "inbox";
  const [messages, counts] = await Promise.all([listMessages(view), countMessages()]);

  const tabs = [
    { view: "inbox", label: "Inbox", count: counts.inbox, href: "/admin/messages" },
    {
      view: "archived",
      label: "Archived",
      count: counts.archived,
      href: "/admin/messages?view=archived",
    },
  ] as const;

  return (
    <>
      <nav aria-label="Message folders" className="border-rule flex gap-1 border-b">
        {tabs.map((t) => (
          <Link
            key={t.view}
            href={t.href}
            aria-current={view === t.view ? "page" : undefined}
            className={`-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-4 font-sans ${
              view === t.view
                ? "border-oxblood text-ink hover:text-ink font-bold"
                : "text-ink-faded hover:text-ink border-transparent"
            }`}
          >
            {t.label}
            <span className="text-ink-faded text-sm tabular-nums">{t.count}</span>
            {t.view === "inbox" && counts.unread > 0 && (
              <span className="bg-oxblood text-seal-text rounded px-1.5 text-xs font-bold tabular-nums">
                {counts.unread} new
              </span>
            )}
          </Link>
        ))}
      </nav>

      {messages.length === 0 ? (
        <p className="bg-vellum border-rule rounded border px-5 py-4">
          {view === "archived"
            ? "Nothing archived."
            : "No ravens yet. Messages from the contact form will land here."}
        </p>
      ) : (
        <ul className="bg-vellum border-rule divide-rule-faint divide-y rounded border">
          {messages.map((m) => {
            const unread = !m.readAt;
            return (
              <li key={m.id}>
                <Link
                  href={`/admin/messages/${m.id}`}
                  className="text-ink hover:text-ink hover:bg-aged/50 flex flex-col gap-0.5 px-4 py-3 sm:px-5"
                >
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    {unread && (
                      <span
                        aria-hidden="true"
                        className="bg-oxblood inline-block h-2 w-2 shrink-0 self-center rounded-full"
                      />
                    )}
                    <span className={unread ? "font-bold" : undefined}>
                      {m.name}
                      {m.company && <span className="text-ink-faded"> · {m.company}</span>}
                    </span>
                    <span className="text-ink-faded ml-auto text-sm tabular-nums">
                      <time dateTime={m.createdAt.toISOString()}>{formatDate(m.createdAt)}</time>
                    </span>
                  </span>
                  <span className={`text-sm ${unread ? "font-bold" : ""}`}>
                    {unread && <span className="sr-only">Unread: </span>}
                    {m.purpose}
                  </span>
                  <span className="text-ink-faded text-sm">{excerpt(m.body)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
