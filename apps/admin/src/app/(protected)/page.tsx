import Link from "next/link";

import { summariseVendorPerformance } from "@repo/rfq";

import { adminSessionJson } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

const CARDS = [
  { key: "SUBMITTED", label: "Awaiting review", href: "/registrations?status=SUBMITTED" },
  { key: "APPROVED", label: "Approved", href: "/registrations?status=APPROVED" },
  { key: "REJECTED", label: "Rejected", href: "/registrations?status=REJECTED" },
  { key: "DRAFT", label: "In progress", href: "/registrations?status=DRAFT" },
] as const;

const WINDOW_DAYS = 90;

type DashboardPayload = {
  byStatus: Record<string, number>;
  activeVendors: number;
  openCount: number;
  closingSoon: number;
  awaitingAward: number;
  performance: { email: string; invited: number; submitted: number; won: number }[];
};

export default async function AdminDashboard() {
  const result = await adminSessionJson<DashboardPayload>("/dashboard");
  if (!result.ok) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        Could not load dashboard ({result.status}).
      </p>
    );
  }

  const { byStatus, activeVendors, openCount, closingSoon, awaitingAward, performance } =
    result.data;
  const counts = byStatus ?? {};
  const rows = summariseVendorPerformance(performance ?? []);

  const headline = [
    { label: "Active suppliers", value: activeVendors ?? 0, href: "/vendors" },
    { label: "Open requirements", value: openCount ?? 0, href: "/requirements" },
    { label: "Closing in 48h", value: closingSoon ?? 0, href: "/requirements" },
    { label: "Awaiting award", value: awaitingAward ?? 0, href: "/requirements" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Sourcing activity and vendor registrations. Rates cover the last {WINDOW_DAYS} days.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/requirements"
            className="bg-brand-blue focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Create requirement
          </Link>
          <Link
            href="/vendors"
            className="focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 focus-visible:ring-2 focus-visible:outline-none"
          >
            Add vendor
          </Link>
        </div>
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
        {rows.length === 0 ? (
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
                {rows.map((p) => (
                  <tr key={p.email} className="transition-colors hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-950">{p.email}</td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.invited}</td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.submitted}</td>
                    <td className="px-4 py-3 tabular-nums">
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
