import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { getSettings } from "@/server/content/settings";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsAdmin() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <span className="text-ink-faded text-sm">System</span>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-ink-faded">Site-wide details that appear on every page.</p>
      </div>
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
