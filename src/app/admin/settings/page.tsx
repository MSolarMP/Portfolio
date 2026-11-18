import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { getSettings } from "@/modules/settings";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsAdmin() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Site-wide details that appear on every page."
      />
      <Suspense fallback={<ContentSkeleton label="Loading settings…" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  const s = await getSettings();
  return (
    <SettingsForm
      initial={{
        openToWork: s.openToWork,
        roleType: s.roleType ?? "",
        githubUrl: s.githubUrl ?? "",
        linkedinUrl: s.linkedinUrl ?? "",
      }}
    />
  );
}
