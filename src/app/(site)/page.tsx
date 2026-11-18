import Link from "next/link";
import { Ornament } from "@/components/site/ornament";
import { QuestCard } from "@/components/site/quest-card";
import { SectionHeading } from "@/components/site/section-heading";
import { copyReader, initials } from "@/lib/copy";
import { formatMonthRange } from "@/lib/format";
import { SKILL_CATEGORIES } from "@/lib/schemas/skill";
import { getChronicle, getExperience } from "@/server/content/chapters";
import { getPageCopy } from "@/server/content/content-blocks";
import { getFeaturedQuests } from "@/server/content/quests";
import { getPublicSettings } from "@/server/content/settings";
import { getSkills } from "@/server/content/skills";

type Copy = ReturnType<typeof copyReader>;

const wrap = "mx-auto w-full max-w-300 px-4 sm:px-8";
const textLink = "font-display inline-flex min-h-11 items-center font-bold tracking-wide";

// Every read below is cached and tagged, so the page prerenders as static HTML and
// the admin's saves refresh it. Sections with nothing published yet are left out.
export default async function Home() {
  const t = copyReader(await getPageCopy("home"));
  return (
    <>
      <Hero t={t} />
      <div className={wrap}>
        <Ornament />
      </div>
      <AbilityScores t={t} />
      <FeaturedQuests t={t} />
      <ChroniclePreview t={t} />
      <RavenCallout t={t} />
    </>
  );
}

async function Hero({ t }: { t: Copy }) {
  const xp = await getExperience();
  const name = t("home.hero.name");
  const sheet = [
    ["Class", t("home.sheet.class")],
    ["Background", t("home.sheet.background")],
    ["Home", t("home.sheet.home")],
  ] as const;

  return (
    <section
      aria-labelledby="hero-name"
      className={`${wrap} flex flex-wrap items-center gap-12 pt-14 pb-20 lg:gap-16 lg:pt-18 lg:pb-24`}
    >
      <div className="animate-rise flex min-w-0 flex-[1_1_520px] flex-col gap-5.5">
        <span className="label-caps">{t("home.hero.eyebrow")}</span>
        <h1
          id="hero-name"
          className="font-display text-[clamp(3rem,8vw,6.25rem)] leading-[1.05] font-bold text-balance"
        >
          {name}
        </h1>
        <p className="text-oxblood text-[1.75rem] leading-snug text-pretty italic sm:text-3xl">
          {t("home.hero.tagline")}
        </p>
        <p className="text-ink-faded max-w-140 text-xl text-pretty">{t("home.hero.intro")}</p>
        <dl className="flex flex-wrap gap-x-7 gap-y-2 text-[1.0625rem]">
          {sheet.map(([term, value]) => (
            <div key={term}>
              <dt className="label-caps inline">{term} </dt>
              <dd className="inline">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-4 pt-1.5">
          <Link href="/quests" className="btn-seal">
            {t("home.hero.cta")}
          </Link>
          <Link href="/contact" className="btn-vellum">
            {t("home.hero.cta2")}
          </Link>
        </div>
      </div>

      <div className="flex min-w-70 flex-[0_1_400px] flex-col">
        {/* Portrait frame. The commissioned art goes here once it's uploaded (Phase 2 checklist). */}
        <div className="ledger-card gem p-3.5" data-decor>
          <div className="bg-aged border-rule flex h-80 items-center justify-center border sm:h-115">
            <span className="wax-seal h-36 w-36 text-5xl">{initials(name)}</span>
          </div>
        </div>
        {xp && (
          <div className="leather stitch mx-4.5 -mt-0.5 flex flex-col gap-2.5 px-5.5 py-4.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-gold-thread text-lg font-bold">
                {name.split(" ")[0]} · Lv {xp.level}
              </span>
              <span className="font-sans text-sm">{xp.level}+ years</span>
            </div>
            <div
              role="img"
              aria-label={`Experience: ${Math.round(xp.progress * 100)}% of the way to level ${xp.level + 1}`}
              className="bg-leather-dark border-gold-thread h-2.5 border"
            >
              <div
                className="bg-gold-thread animate-glow h-full"
                style={{ width: `${Math.round(xp.progress * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

async function AbilityScores({ t }: { t: Copy }) {
  const skills = await getSkills();
  const scores = SKILL_CATEGORIES.map(({ key, label }) => {
    const inCategory = skills.filter((s) => s.category === key);
    const lead = inCategory.find((s) => s.headline) ?? inCategory[0];
    const rest = inCategory.filter((s) => s !== lead).slice(0, 3);
    return { key, label, lead, rest };
  }).filter((score) => score.lead);
  if (scores.length === 0) return null;

  return (
    <section aria-labelledby="abilities" className={`${wrap} flex flex-col gap-8 pt-18 pb-10`}>
      <SectionHeading
        id="abilities"
        eyebrow={t("home.skills.eyebrow")}
        title={t("home.skills.title")}
      />
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-5">
        {scores.map(({ key, label, lead, rest }) => (
          <li key={key} className="ledger-card flex flex-col gap-1.5 px-4 py-5.5 text-center">
            <span className="label-caps">{label}</span>
            <span className="font-display text-[1.375rem] font-bold">{lead!.name}</span>
            {rest.length > 0 && (
              <span className="text-ink-faded text-[15px]">
                {rest.map((s) => s.name).join(" · ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

async function FeaturedQuests({ t }: { t: Copy }) {
  const quests = await getFeaturedQuests();
  if (quests.length === 0) return null;

  return (
    <section aria-labelledby="quests" className={`${wrap} flex flex-col gap-9 pt-18 pb-12`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          id="quests"
          eyebrow={t("home.quests.eyebrow")}
          title={t("home.quests.title")}
          align="start"
        />
        <Link href="/quests" className={textLink}>
          View the quest board<span aria-hidden="true">&nbsp;→</span>
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,310px),1fr))] gap-7">
        {quests.map((quest) => (
          <QuestCard key={quest.slug} quest={quest} />
        ))}
      </div>
    </section>
  );
}

async function ChroniclePreview({ t }: { t: Copy }) {
  const chapters = (await getChronicle()).slice(0, 3);
  if (chapters.length === 0) return null;

  return (
    <section
      aria-labelledby="chronicle"
      className={`${wrap} flex max-w-230! flex-col gap-7 pt-18 pb-12`}
    >
      <SectionHeading
        id="chronicle"
        eyebrow={t("home.chronicle.eyebrow")}
        title={t("home.chronicle.title")}
      />
      <ol>
        {chapters.map((chapter, i) => (
          <li key={chapter.id} className="border-rule flex gap-5 border-b py-5 last:border-b-0">
            <span
              className={`wax-seal h-12 w-12 text-base ${i === 0 ? "" : "bg-leather!"}`}
              aria-hidden="true"
            >
              {chapter.numeral}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="label-caps">
                {formatMonthRange(chapter.startDate, chapter.endDate)}
              </span>
              <h3 className="font-display text-[1.375rem] leading-snug font-bold">
                {chapter.role} — {chapter.company}
              </h3>
              <p className="text-ink-faded">{chapter.summary}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link href="/chronicle" className={`${textLink} self-center`}>
        Read the full chronicle<span aria-hidden="true">&nbsp;→</span>
      </Link>
    </section>
  );
}

async function RavenCallout({ t }: { t: Copy }) {
  const settings = await getPublicSettings();
  return (
    <section aria-labelledby="raven" className={`${wrap} pt-12 pb-24`}>
      <div className="leather stitch flex flex-wrap items-center justify-between gap-8 px-6 py-12 sm:px-12 sm:py-14">
        <div className="flex max-w-160 flex-col gap-2.5">
          <SectionHeading
            id="raven"
            eyebrow={t("home.raven.eyebrow")}
            title={t("home.raven.title")}
            align="start"
            onLeather
          />
          <p className="text-on-leather-muted text-[1.1875rem] text-pretty">
            {t("home.raven.body")}
          </p>
          {settings.openToWork && (
            <p className="text-gold-thread font-sans">
              Open to work{settings.roleType && ` · ${settings.roleType}`}
            </p>
          )}
        </div>
        <Link href="/contact" className="btn-seal">
          {t("home.raven.cta")}
        </Link>
      </div>
    </section>
  );
}
