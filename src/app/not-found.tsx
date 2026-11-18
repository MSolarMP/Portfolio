import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = { title: "Page not found" };

/** Any URL that matches no route. Renders in the root layout, so it brings the site chrome itself. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}
