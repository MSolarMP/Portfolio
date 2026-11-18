import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { DeleteButton } from "@/components/admin/delete-button";
import { dateToMonth } from "@/lib/schemas/chapter";
import { getChapter } from "@/server/content/chapters";
import { deleteChapter } from "../actions";
import { ChapterForm } from "../chapter-form";

export async function generateMetadata({
  params,
}: PageProps<"/admin/chronicle/[id]">): Promise<Metadata> {
  const chapter = await getChapter((await params).id);
  return {
    title: chapter ? `${chapter.role}, ${chapter.company} · Chronicle` : "Chapter not found",
  };
}

export default function EditChapter({ params, searchParams }: PageProps<"/admin/chronicle/[id]">) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/chronicle" className="-mb-5 self-start text-sm">
        ← Chronicle
      </Link>
      <Suspense fallback={<ContentSkeleton label="Loading chapter…" />}>
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Editor({ params, searchParams }: PageProps<"/admin/chronicle/[id]">) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const chapter = await getChapter(id);
  if (!chapter) notFound();

  const linked = chapter._count.quests;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display min-w-0 text-3xl font-bold wrap-break-word">
          <span className="text-bronze-text">{chapter.numeral}.</span> {chapter.role}
        </h1>
        <DeleteButton
          action={deleteChapter.bind(null, chapter.id)}
          title={`Delete “${chapter.role}, ${chapter.company}”?`}
          description={
            linked
              ? `It disappears from the timeline straight away. Its ${linked} linked quest${linked === 1 ? "" : "s"} stay, without a chapter.`
              : "It disappears from the timeline straight away."
          }
          confirmLabel="Delete chapter"
        />
      </div>

      <ChapterForm
        id={chapter.id}
        justCreated={created === "1"}
        initial={{
          numeral: chapter.numeral,
          role: chapter.role,
          company: chapter.company,
          location: chapter.location ?? "",
          startMonth: dateToMonth(chapter.startDate),
          endMonth: dateToMonth(chapter.endDate),
          summary: chapter.summary,
          bullets: chapter.bullets,
          stack: chapter.stack.join(", "),
        }}
      />
    </>
  );
}
