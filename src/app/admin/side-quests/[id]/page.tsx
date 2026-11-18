import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import { getInterest } from "@/server/content/interests";
import { SideQuestForm } from "../side-quest-form";
import { DeleteSideQuest } from "./delete-side-quest";

export async function generateMetadata({
  params,
}: PageProps<"/admin/side-quests/[id]">): Promise<Metadata> {
  const quest = await getInterest((await params).id);
  return { title: quest ? `${quest.title} · Side quests` : "Side quest not found" };
}

export default async function EditSideQuest({
  params,
  searchParams,
}: PageProps<"/admin/side-quests/[id]">) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const quest = await getInterest(id);
  if (!quest) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link href="/admin/side-quests" className="text-sm">
            ← Side quests
          </Link>
          <h1 className="font-display flex flex-wrap items-center gap-3 text-3xl font-bold wrap-break-word">
            {quest.title} <StatusBadge status={quest.status} />
          </h1>
        </div>
        <DeleteSideQuest id={quest.id} title={quest.title} />
      </div>

      <SideQuestForm
        id={quest.id}
        justCreated={created === "1"}
        initial={{
          title: quest.title,
          slug: quest.slug,
          tagline: quest.tagline ?? "",
          attribute: quest.attribute ?? "",
          stats: quest.stats,
          status: quest.status,
          featured: quest.featured,
        }}
      />
    </div>
  );
}
