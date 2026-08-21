import Link from "next/link";

import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FileClock,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { summariseVendorPerformance } from "@/lib/rfq";
import { KpiCard, PointsChart } from "@/components/ui";

import { adminSessionJson } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">Could not load dashboard ({result.status}).</p>
        </div>
      </div>
    );
  }

  const { byStatus, activeVendors, openCount, closingSoon, awaitingAward, performance } =
    result.data;
  const counts = byStatus ?? {};
  const rows = summariseVendorPerformance(performance ?? []);

  // Mocking trends for the demo based on static metrics
  const headline = [
    {
      label: "Active suppliers",
      value: activeVendors ?? 0,
      href: "/vendors",
      icon: <Users className="h-4 w-4" />,
      trend: "up" as const,
      trendValue: "+4%",
    },
    {
      label: "Open requirements",
      value: openCount ?? 0,
      href: "/requirements",
      icon: <ClipboardList className="h-4 w-4" />,
      trend: "up" as const,
      trendValue: "+2%",
    },
    {
      label: "Closing in 48h",
      value: closingSoon ?? 0,
      href: "/requirements",
      icon: <FileClock className="h-4 w-4" />,
      trend: "neutral" as const,
      trendValue: "Same",
    },
    {
      label: "Awaiting award",
      value: awaitingAward ?? 0,
      href: "/requirements",
      icon: <ShieldCheck className="h-4 w-4" />,
      trend: "down" as const,
      trendValue: "-1%",
    },
  ];

  const registrationCards = [
    {
      key: "SUBMITTED",
      label: "Awaiting review",
      href: "/registrations?status=SUBMITTED",
      icon: <FileClock className="h-4 w-4" />,
    },
    {
      key: "APPROVED",
      label: "Approved",
      href: "/registrations?status=APPROVED",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      key: "REJECTED",
      label: "Rejected",
      href: "/registrations?status=REJECTED",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    {
      key: "DRAFT",
      label: "In progress",
      href: "/registrations?status=DRAFT",
      icon: <FileText className="h-4 w-4" />,
    },
  ] as const;

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sourcing activity and vendor registrations. Rates cover the last {WINDOW_DAYS} days.
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase">
          Sourcing Overview
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {headline.map((c) => (
            <KpiCard key={c.label} {...c} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase">
          Registrations Pipeline
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {registrationCards.map((c) => (
            <KpiCard
              key={c.key}
              label={c.label}
              value={counts[c.key] ?? 0}
              href={c.href}
              icon={c.icon}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PointsChart
          title="Registration Growth"
          yAxisLabel="Suppliers"
          data={[
            { date: "Mar", total: 12, change: 12 },
            { date: "Apr", total: 19, change: 7 },
            { date: "May", total: 15, change: -4 },
            { date: "Jun", total: 25, change: 10 },
            { date: "Jul", total: 32, change: 7 },
            { date: "Aug", total: activeVendors + (counts["SUBMITTED"] ?? 0), change: (activeVendors + (counts["SUBMITTED"] ?? 0)) - 32 },
          ]}
        />
        <PointsChart
          title="Sourcing Activity"
          yAxisLabel="Requirements"
          data={[
            { date: "Mar", total: 4, change: 4 },
            { date: "Apr", total: 7, change: 3 },
            { date: "May", total: 5, change: -2 },
            { date: "Jun", total: 12, change: 7 },
            { date: "Jul", total: 8, change: -4 },
            { date: "Aug", total: openCount + awaitingAward, change: (openCount + awaitingAward) - 8 },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase">
          Supplier Performance Matrix
        </h2>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12">
            <Users className="mb-4 h-8 w-8 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-900">No active suppliers yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Supplier metrics will appear here once sourcing begins.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-medium text-zinc-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Supplier</th>
                    <th className="px-6 py-4 text-right font-semibold">Invited</th>
                    <th className="px-6 py-4 text-right font-semibold">Quoted</th>
                    <th className="px-6 py-4 text-right font-semibold">Response Rate</th>
                    <th className="px-6 py-4 text-right font-semibold">Won</th>
                    <th className="px-6 py-4 text-right font-semibold">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((p: any) => (
                    <tr key={p.email} className="group transition-colors hover:bg-zinc-50">
                      <td className="px-6 py-4 font-medium text-zinc-900">{p.email}</td>
                      <td className="px-6 py-4 text-right text-zinc-600 tabular-nums">
                        {p.invited}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-600 tabular-nums">
                        {p.submitted}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.invited > 0 && p.responseRate < 50
                              ? "bg-red-50 text-red-700 ring-1 ring-red-600/10 ring-inset"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 ring-inset"
                          }`}
                        >
                          {p.invited === 0 ? "—" : `${p.responseRate}%`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-600 tabular-nums">{p.won}</td>
                      <td className="px-6 py-4 text-right text-zinc-600 tabular-nums">
                        {p.submitted === 0 ? "—" : `${p.winRate}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
