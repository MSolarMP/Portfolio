import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="ledger-card gem flex max-w-xl flex-col items-center gap-4 px-6 py-12 text-center sm:px-12">
        <span className="wax-seal h-20 w-20 text-xl" aria-hidden="true">
          403
        </span>
        <span className="label-caps">This chamber is sealed</span>
        <h1 className="font-display text-3xl font-bold text-balance sm:text-4xl">
          Only the Keeper may enter
        </h1>
        <p className="text-ink-faded">
          You&apos;re signed in, but the Archive is reserved for the site&apos;s owner.
        </p>
        <div className="flex flex-wrap justify-center gap-6 pt-2">
          <Link href="/" className="font-display inline-flex min-h-11 items-center font-bold">
            Return to the ledger
          </Link>
        </div>
      </div>
    </main>
  );
}
