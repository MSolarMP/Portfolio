import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StackList } from "@/components/site/quest-card";
import { QUEST_KIND, RARITY } from "@/components/site/quest-meta";
import { RichText } from "@/components/site/rich-text";
import { SiteImage } from "@/components/site/site-image";
import { orNull } from "@/lib/errors";
import { formatMonthRange } from "@/lib/format";
import { toRoman } from "@/lib/roman";
import { getPublishedQuest, listPublishedQuests, type QuestPublic } from "@/modules/quests";

const wrap = "mx-auto w-full max-w-300 px-4 sm:px-8";

/**
 * Prerender every published quest. Cache Components needs at least one param to validate
 * the route, so with nothing published a placeholder is returned; it 404s like any unknown slug.
 */
export async function generateStaticParams() {
  const quests = await listPublishedQuests();
  return quests.length ? quests.map((q) => ({ slug: q.slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/quests/[slug]">): Promise<Metadata> {
  const quest = await orNull(getPublishedQuest((await params).slug));
  return quest ? { title: quest.title, description: quest.summary } : { title: "Quest not found" };
}

/** One case study: briefing → problem → constraints → approach → boss fight → outcome → loot. */
export default async function QuestPage({ params }: PageProps<"/quests/[slug]">) {
  const quest = await orNull(getPublishedQuest((await params).slug));
  if (!quest) notFound();

  const sections = quest.sections
    .filter((s) => s.doc)
    .map((s, i) => ({ ...s, numeral: toRoman(i + 1), id: s.key.toLowerCase() }));
  const hasApproach = sections.some((s) => s.key === "approach");

  return (
    <>
      <QuestHeader quest={quest} />

      <div className={`${wrap} flex flex-wrap items-start gap-12 pb-20`}>
        {sections.length > 1 && (
          <nav
            aria-label="On this page"
            className="hidden flex-[1_1_200px] flex-col gap-0.5 lg:sticky lg:top-6 lg:flex"
          >
            <span className="label-caps pb-2">Contents</span>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="border-rule text-leather hover:border-oxblood hover:text-oxblood flex min-h-11 items-center border-l-2 pl-3.5 font-sans text-[15px] no-underline"
              >
                {s.numeral} · {s.title}
              </a>
            ))}
          </nav>
        )}

        <article className="flex min-w-0 flex-[999_1_640px] flex-col gap-11 text-[1.1875rem] leading-relaxed">
          {sections.map((s, i) =>
            s.key === "bossFight" ? (
              <section
                key={s.id}
                id={s.id}
                aria-labelledby={`${s.id}-h`}
                className="leather stitch flex scroll-mt-6 flex-col gap-3 px-6 py-8 sm:px-9"
              >
                <span className="label-caps text-gold-thread">{s.numeral}</span>
                <h2 id={`${s.id}-h`} className="font-display text-on-leather text-3xl font-bold">
                  {s.title}
                </h2>
                <RichText doc={s.doc} headingOffset={1} className="text-on-leather-muted" />
              </section>
            ) : (
              <section
                key={s.id}
                id={s.id}
                aria-labelledby={`${s.id}-h`}
                className="flex scroll-mt-6 flex-col gap-3"
              >
                <h2
                  id={`${s.id}-h`}
                  className="font-display flex items-baseline gap-3.5 text-3xl leading-tight font-bold"
                >
                  <span className="text-oxblood text-sm tracking-widest">{s.numeral}</span>
                  {s.title}
                </h2>
                <RichText
                  doc={s.doc}
                  headingOffset={1}
                  className={i === 0 ? "drop-cap text-[1.1875rem]" : "text-[1.1875rem]"}
                />
                {s.key === "approach" && <Diagram quest={quest} />}
              </section>
            ),
          )}
          {!hasApproach && <Diagram quest={quest} />}
          <MoreQuests quest={quest} />
        </article>
      </div>
    </>
  );
}

function QuestHeader({ quest }: { quest: QuestPublic }) {
  const r = RARITY[quest.rarity];
  const facts = [
    quest.role && { term: "Role", value: quest.role },
    quest.chapter && {
      term: "Chapter",
      value: (
        <>
          {quest.chapter.role} — {quest.chapter.company}
          <span className="text-ink-faded block text-base">
            {formatMonthRange(quest.chapter.startDate, quest.chapter.endDate)}
          </span>
        </>
      ),
    },
    quest.stack.length > 0 && { term: "Spells", value: <StackList stack={quest.stack} /> },
    (quest.liveUrl || quest.repoUrl) && {
      term: "Links",
      value: (
        <span className="flex flex-col">
          {quest.liveUrl && <a href={quest.liveUrl}>Live site</a>}
          {quest.repoUrl && <a href={quest.repoUrl}>Source code</a>}
        </span>
      ),
    },
  ].filter(Boolean) as { term: string; value: React.ReactNode }[];

  return (
    <section aria-labelledby="quest-title" className={`${wrap} flex flex-col gap-5 pt-10 pb-10`}>
      <nav aria-label="Breadcrumb" className="font-sans text-[15px]">
        <ol className="flex flex-wrap gap-1.5">
          <li>
            <Link href="/quests">Quest board</Link>
          </li>
          <li className="text-ink-faded" aria-current="page">
            <span aria-hidden="true">/ </span>
            {quest.title}
          </li>
        </ol>
      </nav>
      <div className="flex flex-wrap items-center gap-6">
        <span
          className={`wax-seal h-16 w-16 text-[11px] tracking-wider sm:h-23 sm:w-23 sm:text-[13px] ${r.className}`}
          aria-hidden="true"
        >
          {r.seal}
        </span>
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-1.5">
          <span className="label-caps">
            <span className="sr-only">{r.label} quest · </span>
            {[QUEST_KIND[quest.kind], quest.client].filter(Boolean).join(" · ")}
          </span>
          <h1
            id="quest-title"
            className="font-display animate-rise text-[clamp(2.5rem,5.5vw,4.25rem)] leading-[1.08] font-bold text-balance"
          >
            {quest.title}
          </h1>
          <p className="text-oxblood text-2xl leading-snug text-pretty italic">{quest.summary}</p>
        </div>
      </div>
      {facts.length > 0 && (
        <dl className="ledger-card mt-2 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4 px-6.5 py-5.5">
          {facts.map((f) => (
            <div key={f.term} className="flex flex-col gap-1">
              <dt className="label-caps">{f.term}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function Diagram({ quest }: { quest: QuestPublic }) {
  if (!quest.diagram) return null;
  return (
    <figure className="ledger-card gem mt-2 flex flex-col gap-2.5 p-4">
      <SiteImage
        image={quest.diagram}
        sizes="(min-width: 1200px) 820px, 100vw"
        className="bg-aged h-auto w-full"
      />
      {quest.diagram.caption && (
        <figcaption className="text-ink-faded text-center font-sans text-[15px]">
          {quest.diagram.caption}
        </figcaption>
      )}
    </figure>
  );
}

function MoreQuests({ quest }: { quest: QuestPublic }) {
  if (!quest.previous && !quest.next) return null;
  return (
    <nav
      aria-label="More quests"
      className="border-rule font-display flex flex-wrap justify-between gap-4 border-t pt-6 font-bold"
    >
      {quest.previous ? (
        <Link href={`/quests/${quest.previous.slug}`} className="inline-flex min-h-11 items-center">
          <span aria-hidden="true">←&nbsp;</span>
          <span className="sr-only">Previous quest: </span>
          {quest.previous.title}
        </Link>
      ) : (
        <span />
      )}
      {quest.next && (
        <Link href={`/quests/${quest.next.slug}`} className="inline-flex min-h-11 items-center">
          <span className="sr-only">Next quest: </span>
          {quest.next.title}
          <span aria-hidden="true">&nbsp;→</span>
        </Link>
      )}
    </nav>
  );
}
