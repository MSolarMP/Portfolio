import type { Metadata } from "next";
import { blankValues, ChapterForm } from "../chapter-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "New chapter" };

export default function NewChapter() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        back={{ href: "/admin/chronicle", label: "Chronicle" }}
        title="New chapter"
        description="It goes to the top of the timeline. Drag it elsewhere later."
      />
      <ChapterForm initial={blankValues} />
    </div>
  );
}
