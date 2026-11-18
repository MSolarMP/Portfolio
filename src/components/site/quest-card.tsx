import Link from "next/link";
import type { Rarity } from "@/generated/prisma/client";
import type { PublicImage } from "@/server/content/media";
import { SiteImage } from "./site-image";

const rarity: Record<Rarity, { seal: string; label: string; className: string }> = {
  LEGENDARY: { seal: "LEG.", label: "Legendary", className: "" },
  EPIC: { seal: "EPIC", label: "Epic", className: "bg-leather!" },
  RARE: { seal: "RARE", label: "Rare", className: "bg-moss!" },
};

export type QuestCardData = {
  slug: string;
  title: string;
  client: string | null;
  rarity: Rarity;
  summary: string;
  stack: string[];
  image: PublicImage | null;
};

/** A quest on the board: image, client, rarity seal, title, summary, stack, link to the tale. */
export function QuestCard({
  quest,
  headingLevel: H = "h3",
}: {
  quest: QuestCardData;
  headingLevel?: "h2" | "h3";
}) {
  const r = rarity[quest.rarity];
  return (
    <article className="ledger-card gem flex flex-col gap-3.5 p-4.5">
      {quest.image && (
        <div className="bg-aged border-rule overflow-hidden border">
          <SiteImage
            image={quest.image}
            sizes="(min-width: 1200px) 360px, (min-width: 700px) 50vw, 100vw"
            className="aspect-video w-full object-cover"
          />
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="label-caps">{quest.client}</span>
        <span
          className={`wax-seal h-13.5 w-13.5 text-[10px] tracking-wider ${r.className}`}
          aria-hidden="true"
        >
          {r.seal}
        </span>
        <span className="sr-only">{r.label} quest</span>
      </div>
      <H className="font-display text-[1.625rem] leading-tight font-bold">{quest.title}</H>
      <p className="text-ink-faded text-[1.0625rem]">{quest.summary}</p>
      {quest.stack.length > 0 && (
        <ul aria-label="Stack" className="flex flex-wrap gap-1.5">
          {quest.stack.map((tech) => (
            <li
              key={tech}
              className="border-rule bg-parchment text-leather border px-2.5 py-0.5 font-sans text-sm"
            >
              {tech}
            </li>
          ))}
        </ul>
      )}
      <Link
        href={`/quests/${quest.slug}`}
        className="font-display mt-auto inline-flex min-h-11 items-center self-start text-[15px] font-bold tracking-wide"
      >
        Read the tale<span className="sr-only">: {quest.title}</span>
        <span aria-hidden="true">&nbsp;→</span>
      </Link>
    </article>
  );
}
