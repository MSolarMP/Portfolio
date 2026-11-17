import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { requireAdmin } from "@/server/authz";
import { AdminNav } from "./admin-nav";
import { AdminSkeleton } from "./admin-skeleton";

export const metadata: Metadata = {
  title: { default: "The Archive", template: "%s · The Archive" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="bg-parchment flex min-h-screen flex-wrap font-sans text-[15px] leading-normal">
      <a
        href="#content"
        className="bg-vellum text-ink sr-only z-10 px-4 py-2 font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <aside className="leather border-r-bronze flex max-w-full flex-[1_1_250px] flex-col gap-6 border-r-[3px] border-double px-3.5 py-6">
        <Link
          href="/admin"
          className="text-on-leather hover:text-on-leather flex items-center gap-3 px-2"
        >
          <span className="wax-seal h-11 w-11 text-sm" aria-hidden="true">
            MP
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-gold-thread text-lg font-bold">The Archive</span>
            <span className="text-on-leather-muted text-sm">Content console</span>
          </span>
        </Link>
        <AdminNav />
        <div className="border-gold-thread/35 mt-auto flex flex-col gap-3 border-t px-2.5 pt-4">
          <Link
            href="/"
            className="text-on-leather hover:text-gold-light inline-flex min-h-11 items-center"
          >
            View live site ↗
          </Link>
          <Suspense fallback={null}>
            <KeeperBadge />
          </Suspense>
        </div>
      </aside>

      <main id="content" className="min-w-0 flex-[999_1_640px] px-4 py-7 sm:px-8">
        <Suspense fallback={<AdminSkeleton />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}

/** Every admin page renders inside this gate, which enforces the Keeper role. */
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

async function KeeperBadge() {
  const { user } = await requireAdmin();
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-on-leather flex min-w-0 flex-col leading-tight">
        <b className="break-all">{user.name || user.email}</b>
        <span className="text-on-leather-muted text-sm">Keeper</span>
      </span>
      <SignOutButton className="border-gold-thread/60 text-on-leather min-h-11 border px-3 text-sm hover:bg-white/5" />
    </div>
  );
}
