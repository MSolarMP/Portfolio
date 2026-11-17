// Temporary landing page for the first deploy.
// Phase 2 replaces this with the database-driven home page.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-8">
      <div className="ledger-card gem flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
        <span className="wax-seal h-24 w-24 text-2xl" aria-hidden="true">
          MP
        </span>
        <span className="label-caps">Adventurer&apos;s Ledger · being inscribed</span>
        <h1 className="font-display text-4xl leading-tight font-bold sm:text-6xl">
          Matthew Pearce
        </h1>
        <p className="text-oxblood text-2xl italic">
          Full stack engineer &amp; wandering artificer of the web.
        </p>
        <p className="text-ink-faded max-w-md text-lg">
          The ledger is still being written. Quests, chronicles and side quests will appear here
          soon.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2 font-sans">
          <a href="https://github.com" className="font-display font-bold tracking-wide">
            GitHub
          </a>
          <a href="https://linkedin.com" className="font-display font-bold tracking-wide">
            LinkedIn
          </a>
        </div>
      </div>
    </main>
  );
}
