/** One skeleton for every admin loading state, so the fallbacks never swap shape. */
export function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="bg-rule-faint h-9 w-64 animate-pulse rounded" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-vellum border-rule h-24 animate-pulse rounded border" />
        ))}
      </div>
      <span className="sr-only">Opening the Archive…</span>
    </div>
  );
}
