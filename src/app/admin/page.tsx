import type { Metadata } from "next";
import { Suspense } from "react";
import { getSession } from "@/modules/auth";
import { countMessages } from "@/modules/messages";
import { countQuests } from "@/modules/quests";
import { countSideQuests } from "@/modules/side-quests";
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
        <p className="text-ink-faded">An end-to-end sign-in test, then the public site.</p>
      </div>
    </div>
  );
}

async function Overview() {
  const [session, quests, sideQuests, messages] = await Promise.all([
    getSession(),
    countQuests(),
    countSideQuests(),
    countMessages(),
  ]);

  const stats = [
    { label: "Unread ravens", value: messages.unread },
    { label: "Drafts waiting", value: quests.drafts + sideQuests.drafts },
    { label: "Quests", value: quests.total },
    { label: "Side quests", value: sideQuests.total },
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
