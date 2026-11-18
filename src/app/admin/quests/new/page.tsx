import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { listMediaOptions } from "@/modules/media";
import { listChapterOptions } from "@/modules/chronicle";
import { blankValues, QuestForm } from "../quest-form";

export const metadata: Metadata = { title: "New quest" };

export default function NewQuest() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        back={{ href: "/admin/quests", label: "Quests" }}
        title="New quest"
        description="It starts as a draft, so nothing goes live until you publish."
      />
      <Suspense fallback={<ContentSkeleton label="Loading form…" />}>
        <NewQuestForm />
      </Suspense>
    </div>
  );
}

async function NewQuestForm() {
  const [chapters, media] = await Promise.all([listChapterOptions(), listMediaOptions()]);
  return <QuestForm initial={blankValues} chapters={chapters} media={media} />;
}
