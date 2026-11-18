/**
 * Placeholder shown while a page's database content streams in. The page heading
 * renders outside it, so clicking between admin pages shows the new page at once.
 */
export function ContentSkeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="bg-vellum border-rule h-16 animate-pulse rounded border" />
      ))}
      <span className="sr-only" role="status">
        {label}
      </span>
    </div>
  );
}
