import Link from "next/link";

import { prisma } from "@/lib/db";

export async function DashboardActivity() {
  const recent = await prisma.requirement.findMany({
    select: {
      id: true,
      project: true,
      referenceNumber: true,
      updatedAt: true,
      awardedQuoteId: true,
      _count: { select: { quotes: { where: { status: "SUBMITTED" } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  if (recent.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        No sourcing activity yet. Create a requirement to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
      {recent.map((requirement) => (
        <li key={requirement.id}>
          <Link
            href={`/requirements/${requirement.id}`}
            className="focus-visible:ring-brand-blue flex min-h-11 flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none"
          >
            <span className="text-sm font-medium text-zinc-950">
              {requirement.project}
              {requirement.referenceNumber ? (
                <span className="ml-2 text-xs text-zinc-500">{requirement.referenceNumber}</span>
              ) : null}
            </span>
            <span className="text-xs text-zinc-600 tabular-nums">
              {requirement.awardedQuoteId ? "Awarded" : `${requirement._count.quotes} quotes`} ·{" "}
              {requirement.updatedAt.toLocaleDateString("en-GB")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
