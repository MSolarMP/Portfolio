import Link from "next/link";
import { copyReader } from "@/lib/copy";
import { getPageCopy } from "@/modules/content";

/** The themed 404 ("off the map"). Used by both not-found pages. */
export async function NotFoundContent() {
  const t = copyReader(await getPageCopy("notfound"));
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-8">
      <div className="flex max-w-160 flex-col items-center gap-4.5 text-center">
        <svg
          data-decor
          aria-hidden="true"
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          className="text-bronze-text animate-sway"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="60" cy="60" r="52" />
          <circle cx="60" cy="60" r="44" strokeDasharray="3 5" />
          <path d="M60 22 L68 60 L60 98 L52 60 Z" className="fill-oxblood stroke-oxblood" />
          <path d="M22 60 L60 54 L98 60 L60 66 Z" />
        </svg>
        <span className="label-caps">{t("notfound.eyebrow")}</span>
        <h1 className="font-display text-[clamp(2.5rem,5vw,3.75rem)] leading-tight font-bold text-balance">
          {t("notfound.title")}
        </h1>
        <p className="text-ink-faded text-[1.1875rem] text-pretty">{t("notfound.body")}</p>
        <div className="flex flex-wrap justify-center gap-3.5 pt-2.5">
          <Link href="/" className="btn-seal">
            {t("notfound.home")}
          </Link>
          <Link href="/quests" className="btn-vellum">
            {t("notfound.board")}
          </Link>
        </div>
      </div>
    </div>
  );
}
