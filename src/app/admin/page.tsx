import type { Metadata } from "next";
import { Suspense } from "react";
import { getSession } from "@/server/authz";
import { db } from "@/server/db";
import { AdminSkeleton } from "./admin-skeleton";

export const metadata: Metadata = { title: "Overview" };

export default function AdminOverview() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<AdminSkeleton />}>
        <Overview />
      </Suspense>

      <div className="bg-vellum border-rule rounded border px-5 py-4">
        <h2 className="font-display text-base font-bold">Coming next</h2>
        <p className="text-ink-faded">
          Picking images for side-quest covers and quest diagrams, albums, then the Ravens inbox and
          site settings.
        </p>
      </div>
    </div>
  );
}

async function Overview() {
  const [session, draftQuests, draftInterests, quests, interests, messages] = await Promise.all([
    getSession(),
    db.quest.count({ where: { status: "DRAFT" } }),
    db.interest.count({ where: { status: "DRAFT" } }),
    db.quest.count(),
    db.interest.count(),
    db.message.count({ where: { readAt: null } }),
  ]);

  const stats = [
    { label: "Unread ravens", value: messages },
    { label: "Drafts waiting", value: draftQuests + draftInterests },
    { label: "Quests", value: quests },
    { label: "Side quests", value: interests },
  ];

  return (
    <>
      <div>
        <span className="text-ink-faded text-sm">The Archive</span>
        <h1 className="font-display text-3xl font-bold text-balance wrap-break-word">
          Welcome back, {session?.user.name?.split(" ")[0] || "Keeper"}
        </h1>
        <p className="text-ink-faded">Here&apos;s the state of the ledger.</p>
      </div>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-vellum border-rule flex flex-col gap-1 rounded border px-5 py-4"
          >
            <dt className="text-ink-faded">{s.label}</dt>
            <dd className="font-display text-3xl font-bold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
