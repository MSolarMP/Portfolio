import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { listMediaOptions } from "@/server/content/media";
import { blankValues, SideQuestForm } from "../side-quest-form";

export const metadata: Metadata = { title: "New side quest" };

export default function NewSideQuest() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/admin/side-quests" className="text-sm">
          ← Side quests
        </Link>
        <h1 className="font-display text-3xl font-bold">New side quest</h1>
        <p className="text-ink-faded">
          It starts as a draft, so nothing goes live until you publish.
        </p>
      </div>
      <Suspense fallback={<ContentSkeleton label="Loading form…" />}>
        <NewSideQuestForm />
      </Suspense>
    </div>
  );
}

async function NewSideQuestForm() {
  const media = await listMediaOptions();
  return <SideQuestForm initial={blankValues} media={media} />;
}
