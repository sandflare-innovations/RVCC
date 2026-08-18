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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        s.className
      )}
    >
      {s.label}
    </span>
  );
}

export function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-5">
      <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950 tabular-nums">{value}</p>
    </div>
  );
}
