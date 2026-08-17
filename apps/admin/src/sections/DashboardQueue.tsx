import Link from "next/link";

import { describeDeadline } from "@repo/rfq";

import { prisma } from "@/lib/db";

const LIMIT = 5;

export async function DashboardQueue() {
  const now = new Date();
  const in48h = new Date(Date.now() + 48 * 3_600_000);

  const [needsReview, closingSoon, awaitingAward] = await Promise.all([
    prisma.supplierRegistration.findMany({
      where: { status: "SUBMITTED" },
      select: { id: true, referenceNumber: true, email: true, submittedAt: true },
      orderBy: { submittedAt: "asc" },
      take: LIMIT,
    }),
    prisma.requirement.findMany({
      where: { status: "OPEN", closesAt: { gt: now, lte: in48h } },
      select: { id: true, project: true, closesAt: true },
      orderBy: { closesAt: "asc" },
      take: LIMIT,
    }),
    prisma.requirement.findMany({
      where: { status: "OPEN", closesAt: { lte: now }, awardedQuoteId: null },
      select: { id: true, project: true, closesAt: true },
      orderBy: { closesAt: "asc" },
      take: LIMIT,
    }),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <QueueCard title="Needs review" empty="No registrations waiting.">
        {needsReview.map((registration) => (
          <QueueRow
            key={registration.id}
            href={`/registrations/${registration.id}`}
            primary={registration.referenceNumber ?? registration.email}
            secondary={registration.submittedAt?.toLocaleDateString("en-GB") ?? "Not submitted"}
          />
        ))}
      </QueueCard>

      <QueueCard title="Closing soon" empty="Nothing closes in the next 48 hours.">
        {closingSoon.map((requirement) => (
          <QueueRow
            key={requirement.id}
            href={`/requirements/${requirement.id}`}
            primary={requirement.project}
            secondary={describeDeadline(requirement.closesAt).label}
            urgent
          />
        ))}
      </QueueCard>

      <QueueCard title="Awaiting award" empty="No closed requirements need a decision.">
        {awaitingAward.map((requirement) => (
          <QueueRow
            key={requirement.id}
            href={`/requirements/${requirement.id}`}
            primary={requirement.project}
            secondary="Closed, award pending"
          />
        ))}
      </QueueCard>
    </div>
  );
}

function QueueCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <section className="border-l-brand-blue rounded-lg border border-l-4 border-zinc-200 bg-white">
      <h3 className="border-b border-zinc-200 px-4 py-3 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
        {title}
      </h3>
      {isEmpty ? <p className="px-4 py-4 text-sm text-zinc-600">{empty}</p> : <ul>{children}</ul>}
    </section>
  );
}

function QueueRow({
  href,
  primary,
  secondary,
  urgent = false,
}: {
  href: string;
  primary: string;
  secondary: string;
  urgent?: boolean;
}) {
  return (
    <li className="border-b border-zinc-100 last:border-0">
      <Link
        href={href}
        className="focus-visible:ring-brand-blue flex min-h-11 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none"
      >
        <span className="truncate text-sm font-medium text-zinc-950">{primary}</span>
        <span
          className={`shrink-0 text-xs tabular-nums ${
            urgent ? "font-semibold text-zinc-950" : "text-zinc-600"
          }`}
        >
          {urgent ? `Closing soon, ${secondary}` : secondary}
        </span>
      </Link>
    </li>
  );
}
