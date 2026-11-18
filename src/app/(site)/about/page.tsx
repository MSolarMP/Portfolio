import type { Metadata } from "next";
import { RichText } from "@/components/site/rich-text";
import { SiteImage } from "@/components/site/site-image";
import { copyReader } from "@/lib/copy";
import { toRoman } from "@/lib/roman";
import { getPageCopy } from "@/server/content/content-blocks";
import { getPublishedInterests } from "@/server/content/interests";
import { SideQuestFilter } from "./side-quest-filter";

type SideQuest = Awaited<ReturnType<typeof getPublishedInterests>>[number];

const wrap = "mx-auto w-full max-w-300 px-4 sm:px-8";

export async function generateMetadata(): Promise<Metadata> {
  const t = copyReader(await getPageCopy("about"));
  return { title: t("about.title"), description: t("about.tagline") };
}

export default async function AboutPage() {
  const [blocks, quests] = await Promise.all([getPageCopy("about"), getPublishedInterests()]);
  const t = copyReader(blocks);
  const attributes = quests.filter((q) => q.attribute);

  return (
    <>
      <section
        aria-labelledby="about-title"
        className={`${wrap} flex flex-col gap-4.5 pt-14 pb-12 lg:pt-16`}
      >
        <h1
          id="about-title"
          className="font-display animate-rise text-[clamp(3rem,6vw,4.75rem)] leading-[1.05] font-bold"
        >
          {t("about.title")}
        </h1>
        <p className="text-oxblood text-[1.625rem] leading-snug text-pretty italic">
          {t("about.tagline")}
        </p>
        <p className="drop-cap text-ink-faded max-w-160 text-[1.1875rem] text-pretty">
          {t("about.intro")}
        </p>
        {attributes.length > 0 && (
          <dl className="grid max-w-180 grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5 pt-2">
            {attributes.map((q) => (
              <div key={q.slug} className="ledger-card flex flex-col-reverse p-2.5 text-center">
                <dt className="text-[15px]">{q.title}</dt>
                <dd className="label-caps">{q.attribute}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {quests.length > 0 && (
        <section aria-label="Side quest list" className={`${wrap} pb-24`}>
          <SideQuestFilter
            items={quests.map((quest, i) => ({
              slug: quest.slug,
              title: quest.title,
              featured: quest.featured,
              card: <SideQuestCard quest={quest} numeral={toRoman(i + 1)} />,
            }))}
          />
        </section>
      )}
    </>
  );
}

function SideQuestCard({ quest, numeral }: { quest: SideQuest; numeral: string }) {
  const label = (
    <span className="label-caps">
      Side quest {numeral}
      {quest.featured && " · featured"}
    </span>
  );
  const stats = quest.stats.length > 0 && (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 text-base">
      {quest.stats.map((s) => (
        <div key={s.label} className="contents">
          <dt className="font-display text-bronze-text pt-0.5 text-[13px] font-bold tracking-wider">
            {s.label}
          </dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );

  if (quest.featured) {
    return (
      <article className="ledger-card gem flex flex-wrap gap-7 p-4.5">
        {quest.image && (
          <div className="bg-aged min-w-0 flex-[1_1_480px]">
            <SiteImage
              image={quest.image}
              sizes="(min-width: 1200px) 640px, 100vw"
              className="h-full max-h-120 w-full object-cover"
            />
          </div>
        )}
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5 py-2 pr-2">
          {label}
          <h2 className="font-display text-4xl leading-tight font-bold">{quest.title}</h2>
          {quest.tagline && <p className="text-ink-faded">{quest.tagline}</p>}
          {stats}
          <RichText doc={quest.body} headingOffset={1} />
        </div>
      </article>
    );
  }

  return (
    <article className="ledger-card flex w-full flex-col gap-2.5 p-3.5">
      {quest.image && (
        <div className="bg-aged">
          <SiteImage
            image={quest.image}
            sizes="(min-width: 1200px) 360px, (min-width: 640px) 50vw, 100vw"
            className="aspect-video w-full object-cover"
          />
        </div>
      )}
      {label}
      <h2 className="font-display text-2xl leading-tight font-bold">{quest.title}</h2>
      {quest.tagline && <p className="text-ink-faded text-base">{quest.tagline}</p>}
      {stats}
      {quest.body && (
        <details className="group mt-auto">
          <summary className="font-display text-oxblood hover:text-oxblood-dark inline-flex min-h-11 cursor-pointer items-center text-[15px] font-bold tracking-wide">
            Read the tale<span className="sr-only">: {quest.title}</span>
          </summary>
          <RichText doc={quest.body} headingOffset={1} className="pt-1 text-base" />
        </details>
      )}
    </article>
  );
}
