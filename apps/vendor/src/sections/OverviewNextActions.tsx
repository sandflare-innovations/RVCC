import Link from "next/link";

import type { VendorNextAction } from "@repo/rfq";

export function OverviewNextActions({ actions }: { actions: VendorNextAction[] }) {
  if (actions.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-600">
        No open requirements. RVCC will email you when you are invited to quote.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {actions.map((action) => (
        <li
          key={action.id}
          className={`rounded-lg border border-zinc-200 bg-white p-4 ${
            action.deadline.urgent ? "border-l-brand-blue border-l-4" : ""
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-zinc-950">{action.project}</p>
              <p className="mt-0.5 text-sm text-zinc-600">
                {action.referenceNumber ? `${action.referenceNumber} · ` : ""}
                <span className={action.deadline.urgent ? "font-semibold text-zinc-950" : ""}>
                  {action.deadline.urgent
                    ? `Closes soon, ${action.deadline.label}`
                    : action.deadline.label}
                </span>
              </p>
            </div>
            <Link
              href={`/portal/requirements/${action.id}`}
              className="bg-brand-blue focus-visible:ring-brand-blue inline-flex min-h-11 shrink-0 items-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {action.actionLabel}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
