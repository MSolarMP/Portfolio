import type { Status } from "@/generated/prisma/enums";

const styles: Record<Status, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-aged text-ink-faded border-rule" },
  PUBLISHED: { label: "Published", className: "bg-moss-bg text-moss-text border-moss/40" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = styles[status];
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 font-sans text-xs font-bold ${className}`}
    >
      {label}
    </span>
  );
}
