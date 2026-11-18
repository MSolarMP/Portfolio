import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { listMediaOptions } from "@/modules/media";
import { blankValues, SideQuestForm } from "../side-quest-form";

export const metadata: Metadata = { title: "New side quest" };

export default function NewSideQuest() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        back={{ href: "/admin/side-quests", label: "Side quests" }}
        title="New side quest"
        description="It starts as a draft, so nothing goes live until you publish."
      />
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
