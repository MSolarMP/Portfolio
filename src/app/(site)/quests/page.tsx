import type { Metadata } from "next";
import { QuestCard } from "@/components/site/quest-card";
import { copyReader } from "@/lib/copy";
import { getPageCopy } from "@/modules/content";
import { listPublishedQuests } from "@/modules/quests";
import { QuestFilter } from "./quest-filter";

const wrap = "mx-auto w-full max-w-300 px-4 sm:px-8";

export async function generateMetadata(): Promise<Metadata> {
  const t = copyReader(await getPageCopy("quests"));
  return { title: t("quests.title"), description: t("quests.intro") };
}

/** The Quest Board: every published case study and personal project. */
export default async function QuestBoard() {
  const [blocks, quests] = await Promise.all([getPageCopy("quests"), listPublishedQuests()]);
  const t = copyReader(blocks);

  return (
    <>
      <section
        aria-labelledby="board-title"
        className={`${wrap} flex flex-col items-center gap-3 pt-14 pb-8 text-center lg:pt-16`}
      >
        <h1
          id="board-title"
          className="font-display animate-rise text-[clamp(3rem,6vw,4.5rem)] leading-[1.05] font-bold"
        >
          {t("quests.title")}
        </h1>
        <p className="text-ink-faded max-w-170 text-xl text-pretty">{t("quests.intro")}</p>
      </section>

      <section aria-label="Quest list" className={`${wrap} pb-24`}>
        {quests.length > 0 ? (
          <QuestFilter
            items={quests.map((quest) => ({
              slug: quest.slug,
              kind: quest.kind,
              stack: quest.stack,
              card: <QuestCard quest={quest} headingLevel="h2" />,
            }))}
          />
        ) : (
          <p className="text-ink-faded text-center">{t("quests.empty")}</p>
        )}
      </section>
    </>
  );
}
