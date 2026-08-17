import Link from "next/link";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const CARDS = [
  { key: "SUBMITTED", label: "Awaiting review", href: "/registrations?status=SUBMITTED" },
  { key: "APPROVED", label: "Approved", href: "/registrations?status=APPROVED" },
  { key: "REJECTED", label: "Rejected", href: "/registrations?status=REJECTED" },
  { key: "DRAFT", label: "In progress", href: "/registrations?status=DRAFT" },
] as const;

export default async function AdminDashboard() {
  const now = new Date();
  const in48h = new Date(Date.now() + 48 * 3_600_000);

  const [grouped, activeVendors, openCount, closingSoon, awaitingAward] = await Promise.all([
    prisma.supplierRegistration.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.vendorUser.count({ where: { isActive: true } }),
    prisma.requirement.count({ where: { status: "OPEN", closesAt: { gt: now } } }),
    prisma.requirement.count({
      where: { status: "OPEN", closesAt: { gt: now, lte: in48h } },
    }),
    // Closed but not yet awarded — the number that represents work waiting on
    // staff rather than on suppliers.
    prisma.requirement.count({ where: { status: "OPEN", closesAt: { lte: now } } }),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

  const headline = [
    { label: "Active suppliers", value: activeVendors, href: "/vendors" },
    { label: "Open requirements", value: openCount, href: "/requirements" },
    { label: "Closing in 48h", value: closingSoon, href: "/requirements" },
    { label: "Awaiting award", value: awaitingAward, href: "/requirements" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">Sourcing activity and vendor registrations.</p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-[0.12em] text-zinc-600 uppercase">
            Sourcing
          </h2>
          <Link
            href="/vendors/performance"
            className="text-brand-blue text-sm font-semibold underline-offset-2 hover:underline"
          >
            Supplier performance
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {headline.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="hover:border-brand-blue rounded-lg border border-zinc-200 bg-white p-5 transition-colors"
            >
              <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">
                {c.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950 tabular-nums">{c.value}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-[0.12em] text-zinc-600 uppercase">
          Registrations
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CARDS.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className="hover:border-brand-blue rounded-lg border border-zinc-200 bg-white p-5 transition-colors"
            >
              <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">
                {c.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950 tabular-nums">
                {counts[c.key] ?? 0}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
