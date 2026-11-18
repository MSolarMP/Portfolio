// Placeholder inside the themed layout until the database-driven home page lands (Phase 2, next task).
export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-8">
      <div className="ledger-card gem flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
        <span className="label-caps">Adventurer&apos;s Ledger · being inscribed</span>
        <h1 className="font-display text-4xl leading-tight font-bold sm:text-6xl">
          Matthew Pearce
        </h1>
        <p className="text-ink-faded max-w-md text-lg">
          The ledger is still being written. Quests, chronicles and side quests will appear here
          soon.
        </p>
      </div>
    </div>
  );
}
