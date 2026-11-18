/** Bronze rule with a centre diamond, used between page sections. Hidden in Plain view. */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div
      data-decor
      aria-hidden="true"
      className={`text-bronze flex items-center gap-3.5 before:h-px before:flex-1 before:bg-current before:opacity-70 after:h-px after:flex-1 after:bg-current after:opacity-70 ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M9 1 L17 9 L9 17 L1 9 Z" fill="currentColor" />
      </svg>
    </div>
  );
}
