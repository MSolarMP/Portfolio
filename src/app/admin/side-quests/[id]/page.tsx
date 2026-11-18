import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { getInterest } from "@/server/content/interests";
import { deleteInterest } from "../actions";
import { SideQuestForm } from "../side-quest-form";

export async function generateMetadata({
  params,
}: PageProps<"/admin/side-quests/[id]">): Promise<Metadata> {
  const quest = await getInterest((await params).id);
  return { title: quest ? `${quest.title} · Side quests` : "Side quest not found" };
}

export default function EditSideQuest({
  params,
  searchParams,
}: PageProps<"/admin/side-quests/[id]">) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/side-quests" className="-mb-5 self-start text-sm">
        ← Side quests
      </Link>
      <Suspense fallback={<ContentSkeleton label="Loading side quest…" />}>
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Editor({ params, searchParams }: PageProps<"/admin/side-quests/[id]">) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const quest = await getInterest(id);
  if (!quest) notFound();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display flex min-w-0 flex-wrap items-center gap-3 text-3xl font-bold wrap-break-word">
          {quest.title} <StatusBadge status={quest.status} />
        </h1>
        <DeleteButton
          action={deleteInterest.bind(null, quest.id)}
          title={`Delete “${quest.title}”?`}
          description="It disappears from the site straight away. Its albums and cover image stay in the Media vault."
          confirmLabel="Delete side quest"
        />
      </div>

      <SideQuestForm
        id={quest.id}
        justCreated={created === "1"}
        initial={{
          title: quest.title,
          slug: quest.slug,
          tagline: quest.tagline ?? "",
          attribute: quest.attribute ?? "",
          body: quest.body ? JSON.stringify(quest.body) : "",
          stats: quest.stats,
          status: quest.status,
          featured: quest.featured,
        }}
      />
    </>
  );
}
