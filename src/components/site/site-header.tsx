import Link from "next/link";
import { Suspense } from "react";
import { copyReader, initials } from "@/lib/copy";
import { getPageCopy } from "@/server/content/content-blocks";
import { PlainViewToggle } from "./plain-view-toggle";
import { SiteNav, SiteNavList } from "./site-nav";

export async function SiteHeader() {
  const t = copyReader(await getPageCopy("global"));
  const name = t("global.site.name");

  return (
    <header className="leather border-b-bronze border-b-[3px] border-double">
      <div className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-8 lg:min-h-23 lg:flex-nowrap">
        <Link
          href="/"
          className="text-on-leather hover:text-on-leather flex min-h-11 items-center gap-3"
        >
          <span className="wax-seal h-12 w-12 text-[15px]" aria-hidden="true">
            {initials(name)}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-gold-thread text-lg font-bold tracking-wide">
              {name}
            </span>
            <span className="text-on-leather-muted font-sans text-sm">{t("global.site.role")}</span>
          </span>
        </Link>

        {/* Below lg the nav drops to its own full-width row (and wraps on narrow phones). */}
        <div className="order-last w-full min-w-0 lg:order-0 lg:w-auto">
          <Suspense fallback={<SiteNavList pathname={null} />}>
            <SiteNav />
          </Suspense>
        </div>

        <PlainViewToggle />
      </div>
    </header>
  );
}
