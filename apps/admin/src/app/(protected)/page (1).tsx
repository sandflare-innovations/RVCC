import Link from "next/link";

import { summariseVendorPerformance } from "@repo/rfq";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const CARDS = [
  { key: "SUBMITTED", label: "Awaiting review", href: "/registrations?status=SUBMITTED" },
  { key: "APPROVED", label: "Approved", href: "/registrations?status=APPROVED" },
  { key: "REJECTED", label: "Rejected", href: "/registrations?status=REJECTED" },
  { key: "DRAFT", label: "In progress", href: "/registrations?status=DRAFT" },
] as const;

/** Ninety days. An all-time average hides a supplier who has recently stopped replying. */
const WINDOW_DAYS = 90;

export default async function AdminDashboard() {
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
  const now = new Date();
  const in48h = new Date(Date.now() + 48 * 3_600_000);

  const [grouped, activeVendors, openCount, closingSoon, awaitingAward, vendors] =
    await Promise.all([
      prisma.supplierRegistration.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.vendorUser.count({ where: { isActive: true } }),
      prisma.requirement.count({ where: { status: "OPEN", closesAt: { gt: now } } }),
      prisma.requirement.count({
        where: { status: "OPEN", closesAt: { gt: now, lte: in48h } },
      }),
      // Closed but not yet awarded — the number that represents work waiting on
      // staff rather than on suppliers.
      prisma.requirement.count({ where: { status: "OPEN", closesAt: { lte: now } } }),
      prisma.vendorUser.findMany({
        where: { isActive: true },
        select: {
          email: true,
          _count: {
            select: {
              invites: { where: { createdAt: { gte: since } } },
              quotes: { where: { status: "SUBMITTED", submittedAt: { gte: since } } },
            },
          },
          quotes: {
            where: { status: "SUBMITTED", awardedFor: { isNot: null } },
            select: { id: true },
          },
        },
        take: 100,
      }),
    ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

  const performance = summariseVendorPerformance(
    vendors.map((v) => ({
      email: v.email,
      invited: v._count.invites,
      submitted: v._count.quotes,
      won: v.quotes.length,
    }))
  );

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
        <p className="mt-1 text-sm text-zinc-600">
          Sourcing activity and vendor registrations. Rates cover the last {WINDOW_DAYS} days.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-[0.12em] text-zinc-600 uppercase">
          Sourcing
        </h2>
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

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-[0.12em] text-zinc-600 uppercase">
          Supplier performance
        </h2>
        {performance.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            No active suppliers yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs tracking-wide text-zinc-600 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Invited</th>
                  <th className="px-4 py-3 font-semibold">Quoted</th>
                  <th className="px-4 py-3 font-semibold">Response</th>
                  <th className="px-4 py-3 font-semibold">Won</th>
                  <th className="px-4 py-3 font-semibold">Win rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {performance.map((p) => (
                  <tr key={p.email} className="transition-colors hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-950">{p.email}</td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.invited}</td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.submitted}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {/* Never invited reads as a dash: 0% would imply they ignored us. */}
                      <span
                        className={
                          p.invited > 0 && p.responseRate < 50
                            ? "font-semibold text-red-700"
                            : "text-zinc-700"
                        }
                      >
                        {p.invited === 0 ? "—" : `${p.responseRate}%`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.won}</td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      {p.submitted === 0 ? "—" : `${p.winRate}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
