import Link from "next/link";
import { copyReader } from "@/lib/copy";
import { getPageCopy } from "@/modules/content";
import { getPublicSettings } from "@/modules/settings";

const linkClass = "text-on-leather hover:text-gold-light inline-flex min-h-11 items-center";

export async function SiteFooter() {
  const [blocks, settings] = await Promise.all([getPageCopy("global"), getPublicSettings()]);
  const t = copyReader(blocks);

  return (
    <footer className="leather border-t-bronze border-t-[3px] border-double font-sans">
      <div className="mx-auto flex max-w-300 flex-wrap justify-between gap-6 px-4 pt-9 pb-6 sm:px-8">
        <div className="flex max-w-md flex-col gap-1.5">
          <span className="font-display text-gold-thread text-lg font-bold">
            {t("global.site.name")}
          </span>
          <span className="text-on-leather-muted">{t("global.footer.blurb")}</span>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-7">
            <li>
              <Link href="/contact" className={linkClass}>
                Send a Raven
              </Link>
            </li>
            {settings.githubUrl && (
              <li>
                <a href={settings.githubUrl} rel="me" className={linkClass}>
                  GitHub
                </a>
              </li>
            )}
            {settings.linkedinUrl && (
              <li>
                <a href={settings.linkedinUrl} rel="me" className={linkClass}>
                  LinkedIn
                </a>
              </li>
            )}
          </ul>
        </nav>

        <div className="border-gold-thread/35 text-on-leather-faint flex basis-full flex-wrap items-center justify-between gap-x-6 border-t pt-3.5 text-sm">
          <span>© {t("global.site.name")}</span>
          {/* Owner-only sign-in; visitors never need it, so it stays out of the main nav. */}
          <Link
            href="/sign-in"
            className="text-on-leather-faint hover:text-gold-light inline-flex min-h-11 items-center"
          >
            Keeper&apos;s gate
          </Link>
        </div>
      </div>
    </footer>
  );
}
