import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { dateToDay } from "@/lib/schemas/commendation";
import { getCommendation } from "@/server/content/commendations";
import { deleteCommendation } from "../actions";
import { CommendationForm } from "../commendation-form";

export async function generateMetadata({
  params,
}: PageProps<"/admin/commendations/[id]">): Promise<Metadata> {
  const c = await getCommendation((await params).id);
  return { title: c ? `${c.name} · Commendations` : "Commendation not found" };
}

export default function EditCommendation({
  params,
  searchParams,
}: PageProps<"/admin/commendations/[id]">) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/commendations" className="-mb-5 self-start text-sm">
        ← Commendations
      </Link>
      <Suspense fallback={<ContentSkeleton label="Loading commendation…" />}>
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Editor({ params, searchParams }: PageProps<"/admin/commendations/[id]">) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const c = await getCommendation(id);
  if (!c) notFound();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display flex min-w-0 flex-wrap items-center gap-3 text-3xl font-bold wrap-break-word">
          {c.name} <StatusBadge status={c.status} />
        </h1>
        <DeleteButton
          action={deleteCommendation.bind(null, c.id)}
          title={`Delete ${c.name}'s commendation?`}
          description="It disappears from the site straight away. The original stays on LinkedIn."
          confirmLabel="Delete commendation"
        />
      </div>

      <CommendationForm
        id={c.id}
        justCreated={created === "1"}
        initial={{
          quote: c.quote,
          name: c.name,
          headline: c.headline ?? "",
          relationship: c.relationship ?? "",
          givenOn: dateToDay(c.givenOn),
          profileUrl: c.profileUrl ?? "",
          status: c.status,
          featured: c.featured,
        }}
      />
    </>
  );
}
