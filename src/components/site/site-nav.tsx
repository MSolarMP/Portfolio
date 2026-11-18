"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Themed names from PROJECT_PLAN §2.4. Fixed vocabulary, so it lives in code rather than the DB.
const links = [
  { label: "Home", href: "/" },
  { label: "Side Quests", href: "/about" },
  { label: "Quests", href: "/quests" },
  { label: "Chronicle", href: "/chronicle" },
  { label: "Contact", href: "/contact" },
] as const;

/** Main nav with the current section marked. Render inside <Suspense> (it reads the URL). */
export function SiteNav() {
  return <SiteNavList pathname={usePathname()} />;
}

/** `pathname = null` marks nothing: the Suspense fallback while the URL streams in. */
export function SiteNavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main">
      <ul className="flex flex-wrap gap-x-4 sm:gap-x-6">
        {links.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(link.href));
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`font-display inline-flex min-h-11 items-center border-b-2 text-[13px] font-bold tracking-wider sm:text-sm sm:tracking-widest ${
                  active
                    ? "border-gold-thread text-gold-thread hover:text-gold-light"
                    : "text-on-leather hover:text-gold-light border-transparent"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
