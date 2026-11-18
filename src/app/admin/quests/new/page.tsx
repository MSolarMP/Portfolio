import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { listChapterOptions } from "@/server/content/quests";
import { blankValues, QuestForm } from "../quest-form";

export const metadata: Metadata = { title: "New quest" };

export default function NewQuest() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/admin/quests" className="text-sm">
          ← Quests
        </Link>
        <h1 className="font-display text-3xl font-bold">New quest</h1>
        <p className="text-ink-faded">
          It starts as a draft, so nothing goes live until you publish.
        </p>
      </div>
      <Suspense fallback={<ContentSkeleton label="Loading form…" />}>
        <NewQuestForm />
      </Suspense>
    </div>
  );
}

async function NewQuestForm() {
  const chapters = await listChapterOptions();
  return <QuestForm initial={blankValues} chapters={chapters} />;
}
