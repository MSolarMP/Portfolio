import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { QUEST_SECTIONS } from "@/lib/schemas/quest";
import { getQuest, listChapterOptions } from "@/server/content/quests";
import { deleteQuest } from "../actions";
import { QuestForm, type Values } from "../quest-form";

export async function generateMetadata({
  params,
}: PageProps<"/admin/quests/[id]">): Promise<Metadata> {
  const quest = await getQuest((await params).id);
  return { title: quest ? `${quest.title} · Quests` : "Quest not found" };
}

export default function EditQuest({ params, searchParams }: PageProps<"/admin/quests/[id]">) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/quests" className="-mb-5 self-start text-sm">
        ← Quests
      </Link>
      <Suspense fallback={<ContentSkeleton label="Loading quest…" />}>
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Editor({ params, searchParams }: PageProps<"/admin/quests/[id]">) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [quest, chapters] = await Promise.all([getQuest(id), listChapterOptions()]);
  if (!quest) notFound();

  const initial: Values = {
    title: quest.title,
    slug: quest.slug,
    kind: quest.kind,
    rarity: quest.rarity,
    client: quest.client ?? "",
    role: quest.role ?? "",
    summary: quest.summary,
    stack: quest.stack.join(", "),
    repoUrl: quest.repoUrl ?? "",
    liveUrl: quest.liveUrl ?? "",
    chapterId: quest.chapterId ?? "",
    sections: Object.fromEntries(
      QUEST_SECTIONS.map((s) => [s.key, quest[s.key] ? JSON.stringify(quest[s.key]) : ""]),
    ) as Values["sections"],
    status: quest.status,
    featured: quest.featured,
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display flex min-w-0 flex-wrap items-center gap-3 text-3xl font-bold wrap-break-word">
          {quest.title} <StatusBadge status={quest.status} />
        </h1>
        <DeleteButton
          action={deleteQuest.bind(null, quest.id)}
          title={`Delete “${quest.title}”?`}
          description="The case study disappears from the site straight away and can't be recovered. Its diagram stays in the Media vault."
          confirmLabel="Delete quest"
        />
      </div>

      <QuestForm
        id={quest.id}
        initial={initial}
        chapters={chapters}
        justCreated={created === "1"}
      />
    </>
  );
}
