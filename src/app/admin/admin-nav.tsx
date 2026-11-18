"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { label: string; href: string; ready: boolean };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Content",
    items: [
      { label: "Overview", href: "/admin", ready: true },
      { label: "Pages & copy", href: "/admin/pages", ready: true },
      { label: "Side quests", href: "/admin/side-quests", ready: true },
      { label: "Quests (case studies)", href: "/admin/quests", ready: true },
      { label: "Chronicle", href: "/admin/chronicle", ready: true },
      { label: "Skills", href: "/admin/skills", ready: true },
      { label: "Commendations", href: "/admin/commendations", ready: false },
      { label: "Media vault", href: "/admin/media", ready: false },
    ],
  },
  {
    title: "Inbox",
    items: [
      { label: "Ravens (messages)", href: "/admin/messages", ready: false },
      { label: "Delivery log", href: "/admin/delivery-log", ready: false },
    ],
  },
  {
    title: "System",
    items: [{ label: "Settings", href: "/admin/settings", ready: false }],
  },
];

/** The sidebar nav with the current page highlighted. Render inside <Suspense> (it reads the URL). */
export function AdminNav() {
  return <NavList pathname={usePathname()} />;
}

/** The nav itself. `pathname = null` highlights nothing: the Suspense fallback while the URL streams in. */
export function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-0.5">
          <span className="font-display text-gold-thread px-2.5 pb-1.5 text-[11px] font-bold tracking-[0.18em] uppercase">
            {group.title}
          </span>
          {group.items.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : Boolean(pathname?.startsWith(item.href));
            if (!item.ready) {
              return (
                <span
                  key={item.href}
                  className="text-on-leather-faint flex min-h-11 items-center justify-between px-2.5"
                >
                  {item.label}
                  <span className="text-xs italic" aria-hidden="true">
                    soon
                  </span>
                  <span className="sr-only">(coming soon)</span>
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "bg-parchment text-leather hover:text-leather flex min-h-11 items-center px-2.5 font-bold shadow-[inset_3px_0_0_var(--color-oxblood)]"
                    : "text-on-leather hover:text-on-leather flex min-h-11 items-center px-2.5 hover:bg-white/5"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
