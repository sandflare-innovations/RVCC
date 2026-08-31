import type { ReactElement } from "react";

const STYLES: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "In progress",
    className: "border-zinc-300 bg-zinc-100 text-zinc-600",
  },
  SUBMITTED: {
    label: "Awaiting review",
    className: "border-brand-blue text-brand-blue bg-brand-blue/5",
  },
  APPROVED: {
    label: "Approved",
    className: "border-brand-blue bg-brand-blue text-white",
  },
  REJECTED: {
    label: "Rejected",
    className: "border-zinc-900 bg-zinc-900 text-white",
  },
  ACTIVE: {
    label: "Active",
    className: "border-brand-blue bg-brand-blue text-white",
  },
  DISABLED: {
    label: "Disabled",
    className: "border-zinc-900 bg-zinc-900 text-white",
  },
  PUBLISHED: {
    label: "Published",
    className: "border-brand-blue bg-brand-blue text-white",
  },
  DRAFT_CONTENT: {
    label: "Draft",
    className: "border-zinc-300 bg-zinc-100 text-zinc-600",
  },
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function StatusBadge({ status }: { status: string }): ReactElement {
  const s = STYLES[status] ?? {
    label: status,
    className: "border-zinc-300 bg-zinc-100 text-zinc-600",
  };
  return (
    <span
      className={cn(
        "inline-flex min-w-[110px] items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        s.className
      )}
    >
      {s.label}
    </span>
  );
}
