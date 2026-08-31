import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  FileClock,
  FileText,
  Inbox,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BarChart, DonutChart, KpiCard, SmoothScroll } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { summariseVendorPerformance } from "@/lib/rfq";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Quote = {
  id: string;
  newPrice: number;
  submittedAt: string | null;
  vendorName: string;
  vendorEmail: string;
  requirementId: string;
  requirementTitle: string;
};

type DashboardPayload = {
  byStatus: Record<string, number>;
  activeVendors: number;
  openCount: number;
  closingSoon: number;
  awaitingAward: number;
  performance: { email: string; invited: number; submitted: number; won: number }[];
  recentQuotes: Quote[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* ------------------------------------------------------------------ */
/*  Skeleton fallbacks (match the real sections exactly)               */
/* ------------------------------------------------------------------ */

function HeroKpiSkeleton() {
  return (
    <div className="relative z-10 mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 md:gap-8 lg:mt-0 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28 bg-white/20" />
          <Skeleton className="h-8 w-16 bg-white/20" />
        </div>
      ))}
    </div>
  );
}

function MarqueeSkeleton() {
  return (
    <div className="border-brand-blue/10 relative flex h-10 shrink-0 items-center overflow-hidden rounded-full border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="bg-brand-blue absolute left-0 z-10 flex h-full items-center rounded-l-full px-3.5">
        <span className="relative mr-2 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="text-[11px] font-bold tracking-wider text-white uppercase">Live Bids</span>
      </div>
      <div className="flex items-center gap-6 pl-36">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="min-h-[148px] rounded-xl border border-zinc-200 bg-white p-5 py-7">
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <div className="flex lg:col-span-2">
      <section className="flex h-full w-full flex-col">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[148px] rounded-xl border border-zinc-200 bg-white p-5 py-7"
            >
              <Skeleton className="mb-3 h-4 w-28" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LiveBiddingSkeleton() {
  return (
    <div className="lg:col-span-1">
      <section className="flex h-full flex-col">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
          <div className="divide-y divide-zinc-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]"
        >
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
      ))}
    </section>
  );
}

function MatrixSkeleton() {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-5 w-56" />
      </div>
      <div className="overflow-x-auto rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
        <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead className="bg-brand-blue rounded-2xl text-white">
            <tr>
              {["Supplier", "Invited", "Quoted", "Response Rate", "Won", "Win Rate"].map((h) => (
                <th
                  key={h}
                  className={`px-6 py-3.5 font-semibold ${h === "Supplier" ? "rounded-l-2xl" : ""} ${h === "Win Rate" ? "rounded-r-2xl" : ""} ${h !== "Supplier" ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="rounded-2xl bg-white ring-1 ring-zinc-100 ring-inset">
                <td className="rounded-l-2xl px-6 py-4">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-6 py-4 text-right">
                  <Skeleton className="ml-auto h-4 w-12" />
                </td>
                <td className="px-6 py-4 text-right">
                  <Skeleton className="ml-auto h-4 w-12" />
                </td>
                <td className="px-6 py-4 text-right">
                  <Skeleton className="ml-auto h-4 w-14" />
                </td>
                <td className="px-6 py-4 text-right">
                  <Skeleton className="ml-auto h-4 w-8" />
                </td>
                <td className="rounded-r-2xl px-6 py-4 text-right">
                  <Skeleton className="ml-auto h-4 w-12" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Async data components (streamed via Suspense)                      */
/* ------------------------------------------------------------------ */

async function HeroKpiData() {
  const result = await adminSessionJson<DashboardPayload>("/dashboard");
  if (!result.ok) return <HeroKpiSkeleton />;

  const { activeVendors, openCount, closingSoon, byStatus } = result.data;
  const counts = byStatus ?? {};

  return (
    <div className="relative z-10 mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 md:gap-8 lg:mt-0 lg:grid-cols-4">
      {[
        { label: "Active Vendors", value: activeVendors ?? 0 },
        { label: "Open Requirements", value: openCount ?? 0 },
        { label: "Pending Reviews", value: counts["SUBMITTED"] ?? 0 },
        { label: "Closing Soon", value: closingSoon ?? 0, valueClass: "text-amber-300" },
      ].map((kpi) => (
        <div key={kpi.label} className="flex flex-col gap-1">
          <p className="text-sm font-medium text-blue-200">{kpi.label}</p>
          <p className={`text-3xl font-bold tracking-tight md:text-4xl ${kpi.valueClass ?? ""}`}>
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
}

async function MarqueeData() {
  const result = await adminSessionJson<DashboardPayload>("/dashboard");
  if (!result.ok) return null;

  const quotes = result.data.recentQuotes ?? [];
  const mockQuotes = [
    {
      id: "mock1",
      newPrice: 15500,
      vendorName: "Al-Futtaim Engineering",
      requirementTitle: "HVAC Maintenance for Tower A",
      vendorEmail: "alfuttaim@example.com",
      requirementId: "req1",
      submittedAt: new Date().toISOString(),
    },
    {
      id: "mock2",
      newPrice: 3200,
      vendorName: "TechPro Solutions",
      requirementTitle: "Annual IT Support Renewal",
      vendorEmail: "techpro@example.com",
      requirementId: "req2",
      submittedAt: new Date().toISOString(),
    },
    {
      id: "mock3",
      newPrice: 75000,
      vendorName: "Desert Landscape Co",
      requirementTitle: "Campus Landscaping Project",
      vendorEmail: "desertland@example.com",
      requirementId: "req3",
      submittedAt: new Date().toISOString(),
    },
    {
      id: "mock4",
      newPrice: 12000,
      vendorName: "SecureTech Guards",
      requirementTitle: "Security Services - Q4",
      vendorEmail: "securetech@example.com",
      requirementId: "req4",
      submittedAt: new Date().toISOString(),
    },
  ];
  const displayQuotes = quotes.length > 0 ? quotes : mockQuotes;

  if (displayQuotes.length === 0) return null;

  return (
    <div className="border-brand-blue/10 relative flex h-10 shrink-0 items-center overflow-hidden rounded-full border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="bg-brand-blue absolute left-0 z-10 flex h-full items-center rounded-l-full px-3.5">
        <span className="relative mr-2 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="text-[11px] font-bold tracking-wider text-white uppercase">Live Bids</span>
      </div>
      <div className="animate-marquee flex items-center pl-36 whitespace-nowrap">
        {[...displayQuotes, ...displayQuotes, ...displayQuotes].map((quote, i) => (
          <div key={i} className="mx-6 flex items-center text-sm">
            <span className="text-brand-blue font-semibold">
              {quote.vendorName || quote.vendorEmail}
            </span>
            <span className="mx-2 text-zinc-300">•</span>
            <span className="max-w-[200px] truncate text-zinc-600">{quote.requirementTitle}</span>
            <span className="mx-2 text-zinc-300">•</span>
            <span className="text-brand-blue font-bold">{formatCurrency(quote.newPrice || 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function KpiGridData() {
  const result = await adminSessionJson<DashboardPayload>("/dashboard");
  if (!result.ok) return <KpiGridSkeleton />;

  const { activeVendors, openCount, closingSoon, awaitingAward } = result.data;

  return (
    <section className="shrink-0">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
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
        ].map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>
    </section>
  );
}

async function DashboardBodyData() {
  const result = await adminSessionJson<DashboardPayload>("/dashboard");
  if (!result.ok) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">Could not load dashboard data ({result.status}).</p>
        </div>
      </div>
    );
  }

  const {
    byStatus,
    activeVendors,
    openCount,
    closingSoon,
    awaitingAward,
    performance,
    recentQuotes,
  } = result.data;
  const counts = byStatus ?? {};
  const rows = summariseVendorPerformance(performance ?? []);
  const quotes = recentQuotes ?? [];

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

  const mockQuotes = [
    {
      id: "mock1",
      newPrice: 15500,
      vendorName: "Al-Futtaim Engineering",
      requirementTitle: "HVAC Maintenance for Tower A",
      vendorEmail: "alfuttaim@example.com",
      requirementId: "req1",
      submittedAt: new Date().toISOString(),
    },
    {
      id: "mock2",
      newPrice: 3200,
      vendorName: "TechPro Solutions",
      requirementTitle: "Annual IT Support Renewal",
      vendorEmail: "techpro@example.com",
      requirementId: "req2",
      submittedAt: new Date().toISOString(),
    },
    {
      id: "mock3",
      newPrice: 75000,
      vendorName: "Desert Landscape Co",
      requirementTitle: "Campus Landscaping Project",
      vendorEmail: "desertland@example.com",
      requirementId: "req3",
      submittedAt: new Date().toISOString(),
    },
    {
      id: "mock4",
      newPrice: 12000,
      vendorName: "SecureTech Guards",
      requirementTitle: "Security Services - Q4",
      vendorEmail: "securetech@example.com",
      requirementId: "req4",
      submittedAt: new Date().toISOString(),
    },
  ];
  const displayQuotes = quotes.length > 0 ? quotes : mockQuotes;

  return (
    <>
      {/* Live Bidding & Overview Grid */}
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
        {/* Left Column: Metrics */}
        <div className="flex lg:col-span-2">
          <section className="flex h-full w-full flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                Registrations Pipeline
              </h2>
            </div>
            <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-4">
              {registrationCards.map((c) => (
                <KpiCard
                  key={c.key}
                  label={c.label}
                  value={counts[c.key] ?? 0}
                  href={c.href}
                  icon={c.icon}
                  className="min-h-[148px] py-7"
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Live Bidding Updates */}
        <div className="lg:col-span-1">
          <section className="flex h-full flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900">
                <Activity className="text-brand-blue h-5 w-5" />
                Live Bidding
              </h2>
              <span className="text-brand-blue bg-brand-blue/10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="bg-brand-blue absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-brand-blue relative inline-flex h-1.5 w-1.5 rounded-full" />
                </span>
                Live
              </span>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              {displayQuotes.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="bg-brand-blue/10 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                    <Inbox className="text-brand-blue h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-zinc-900">No recent quotes</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Quotes submitted by vendors will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {displayQuotes.map((quote) => (
                    <Link
                      key={quote.id}
                      href={`/requirements/${quote.requirementId}`}
                      className="hover:bg-brand-blue/[0.04] group flex flex-col p-4 transition-colors"
                    >
                      <div className="mb-1 flex items-start justify-between">
                        <p className="group-hover:text-brand-blue truncate pr-4 text-sm font-semibold text-zinc-900 transition-colors">
                          {quote.requirementTitle}
                        </p>
                        <p className="text-brand-blue shrink-0 text-sm font-bold tabular-nums">
                          {formatCurrency(quote.newPrice)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <p className="flex items-center gap-1.5 truncate pr-4">
                          <span className="bg-brand-blue/10 text-brand-blue flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                            {quote.vendorName.charAt(0).toUpperCase()}
                          </span>
                          {quote.vendorName}
                        </p>
                        <p className="shrink-0">
                          {quote.submittedAt ? timeAgo(quote.submittedAt) : "Recently"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="bg-brand-blue/[0.04] mt-auto border-t border-zinc-100 p-4">
                <Link
                  href="/requirements"
                  className="text-brand-blue flex items-center justify-center gap-1 text-xs font-semibold transition-colors hover:text-[#005a94]"
                >
                  View All Activity <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DonutChart
          title="Registration Pipeline"
          data={[
            { name: "Approved", value: counts["APPROVED"] ?? 0, color: "#0073bc" },
            { name: "Pending", value: counts["SUBMITTED"] ?? 0, color: "#4aa3d8" },
            { name: "Rejected", value: counts["REJECTED"] ?? 0, color: "#a6a6a6" },
            { name: "Draft", value: counts["DRAFT"] ?? 0, color: "#cfe4f3" },
          ].filter((d) => d.value > 0)}
        />
        <BarChart
          title="Sourcing Distribution"
          xAxisKey="name"
          bars={[{ dataKey: "value", color: "#0073bc", name: "Total" }]}
          data={[
            { name: "Active Vendors", value: activeVendors },
            { name: "Open Reqs", value: openCount },
            { name: "Closing Soon", value: closingSoon },
            { name: "Awaiting Award", value: awaitingAward },
          ]}
        />
      </section>

      {/* Matrix */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">
            Supplier Performance Matrix
          </h2>
        </div>
        {rows.length === 0 ? (
          <div className="border-brand-blue/20 flex flex-col items-center justify-center rounded-3xl border border-dashed bg-white py-16">
            <div className="bg-brand-blue/10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <Users className="text-brand-blue h-8 w-8" />
            </div>
            <p className="text-sm font-semibold text-zinc-900">No active suppliers yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Supplier metrics will appear here once sourcing begins.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
            <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead className="bg-brand-blue rounded-2xl text-white">
                <tr>
                  <th className="rounded-l-2xl px-6 py-3.5 font-semibold">Supplier</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Invited</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Quoted</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Response Rate</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Won</th>
                  <th className="rounded-r-2xl px-6 py-3.5 text-right font-semibold">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p: any, index: number) => (
                  <tr
                    key={p.email}
                    className="hover:ring-brand-blue/40 group rounded-2xl bg-white ring-1 ring-zinc-100 transition-all ring-inset hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)]"
                  >
                    <td className="flex items-center gap-3 rounded-l-2xl px-6 py-4 font-medium text-zinc-900">
                      {index === 0 && (
                        <span className="bg-brand-blue flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm">
                          1
                        </span>
                      )}
                      {index === 1 && (
                        <span className="bg-brand-blue/70 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm">
                          2
                        </span>
                      )}
                      {index === 2 && (
                        <span className="bg-brand-blue/40 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm">
                          3
                        </span>
                      )}
                      {index > 2 && (
                        <span className="bg-brand-blue/10 text-brand-blue flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                          {index + 1}
                        </span>
                      )}
                      <span className="max-w-[200px] truncate">{p.email}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-600 tabular-nums">{p.invited}</td>
                    <td className="px-6 py-4 text-right text-zinc-600 tabular-nums">
                      {p.submitted}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${p.invited > 0 && p.responseRate < 50 ? "bg-zinc-100 text-zinc-600" : "bg-brand-blue/10 text-brand-blue"}`}
                      >
                        {p.invited === 0 ? "—" : `${p.responseRate}%`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-600 tabular-nums">{p.won}</td>
                    <td className="rounded-r-2xl px-6 py-4 text-right text-zinc-600 tabular-nums">
                      {p.submitted === 0 ? "—" : `${p.winRate}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (static shell + streamed data)                                */
/* ------------------------------------------------------------------ */

export default async function AdminDashboard() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <SmoothScroll className="flex-1">
        <div className="animate-in fade-in relative z-10 min-h-full duration-500">
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 50s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `,
            }}
          />

          <div className="flex min-h-[calc(100dvh-4rem)] flex-col gap-6 pb-8 md:min-h-[calc(100dvh-5.5rem)] md:gap-8 md:pb-10">
            {/* ---- Hero Banner (static shell) ---- */}
            <section className="flex min-h-0 flex-1 flex-col">
              <div className="bg-brand-blue relative z-40 flex h-full min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-[2.5rem] px-8 py-7 text-white shadow-sm md:px-12 md:py-8">
                {/* Decorative Background */}
                <div className="pointer-events-none absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-white opacity-5 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-blue-400 opacity-10 blur-3xl" />

                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="hero-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path
                        d="M0 40L40 0H20L0 20M40 40V20L20 40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </pattern>
                    <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="transparent" />
                      <stop offset="50%" stopColor="white" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hero-pattern)">
                    <animate
                      attributeName="x"
                      from="0"
                      to="-40"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate attributeName="y" from="0" to="40" dur="2s" repeatCount="indefinite" />
                  </rect>
                  <rect width="100%" height="100%" fill="url(#hero-gradient)" />
                </svg>

                {/* Hero Content (static) */}
                <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl text-left">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50 backdrop-blur-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      Live Sourcing Network
                    </div>
                    <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
                      Vendor Management
                    </h1>
                    <p className="text-lg leading-relaxed font-light text-blue-100/90 md:text-xl">
                      Monitor your supply chain, evaluate vendor performance, and manage ongoing
                      requirements in real-time.
                    </p>
                  </div>

                  <Link
                    href="/requirements/new"
                    className="text-brand-blue flex shrink-0 items-center gap-3 self-start rounded-2xl bg-white px-6 py-4 font-semibold shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-black/20"
                  >
                    <div className="rounded-full bg-blue-100 p-1.5">
                      <Plus className="h-5 w-5" />
                    </div>
                    Post Requirement
                  </Link>
                </div>

                {/* ---- Streamed Hero KPIs ---- */}
                <Suspense fallback={<HeroKpiSkeleton />}>
                  <HeroKpiData />
                </Suspense>
              </div>
            </section>

            {/* ---- Streamed Marquee ---- */}
            <Suspense fallback={<MarqueeSkeleton />}>
              <MarqueeData />
            </Suspense>

            {/* ---- Streamed KPI Grid ---- */}
            <Suspense fallback={<KpiGridSkeleton />}>
              <KpiGridData />
            </Suspense>
          </div>

          {/* ---- Streamed Body (Pipeline + Bidding + Charts + Matrix) ---- */}
          <div className="space-y-12 px-4 pt-12 pb-12 md:px-8">
            <Suspense
              fallback={
                <>
                  <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
                    <PipelineSkeleton />
                    <LiveBiddingSkeleton />
                  </div>
                  <ChartsSkeleton />
                  <MatrixSkeleton />
                </>
              }
            >
              <DashboardBodyData />
            </Suspense>
          </div>
        </div>
      </SmoothScroll>
    </div>
  );
}
