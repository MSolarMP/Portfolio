import type { Metadata } from "next";
import Link from "next/link";
import { blankValues, ChapterForm } from "../chapter-form";

export const metadata: Metadata = { title: "New chapter" };

export default function NewChapter() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/admin/chronicle" className="text-sm">
          ← Chronicle
        </Link>
        <h1 className="font-display text-3xl font-bold">New chapter</h1>
        <p className="text-ink-faded">
          It goes to the top of the timeline. Drag it elsewhere later.
        </p>
      </div>
      <ChapterForm initial={blankValues} />
    </div>
  );
}
