import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The top of an admin page: a section label or a "← back" link, the title, an
 * optional description, and an optional primary action (e.g. "New quest").
 */
export function PageHeader({
  eyebrow,
  back,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  back?: { href: string; label: string };
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {back ? (
          <Link href={back.href} className="text-sm">
            ← {back.label}
          </Link>
        ) : (
          eyebrow && <span className="text-ink-faded text-sm">{eyebrow}</span>
        )}
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {description && <p className="text-ink-faded">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="bg-oxblood text-seal-text hover:bg-oxblood-dark hover:text-seal-text inline-flex min-h-11 items-center rounded px-4 font-sans font-bold"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
