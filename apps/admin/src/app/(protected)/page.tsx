import Link from "next/link";

import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FileClock,
  FileText,
  ShieldCheck,
  Users,
  TrendingUp,
  Inbox,
  ArrowUpRight,
  Activity,
  Plus
} from "lucide-react";

import { summariseVendorPerformance } from "@/lib/rfq";
import { KpiCard, PointsChart, DonutChart, BarChart } from "@/components/ui";

import { adminSessionJson } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 90;

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

  const { byStatus, activeVendors, openCount, closingSoon, awaitingAward, performance, recentQuotes } =
    result.data;
  const counts = byStatus ?? {};
  const rows = summariseVendorPerformance(performance ?? []);
  const quotes = recentQuotes ?? [];

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount);
  };

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
  const mockQuotes = [
    { id: "mock1", newPrice: 15500, vendorName: "Al-Futtaim Engineering", requirementTitle: "HVAC Maintenance for Tower A", vendorEmail: "alfuttaim@example.com", requirementId: "req1", submittedAt: new Date().toISOString() },
    { id: "mock2", newPrice: 3200, vendorName: "TechPro Solutions", requirementTitle: "Annual IT Support Renewal", vendorEmail: "techpro@example.com", requirementId: "req2", submittedAt: new Date().toISOString() },
    { id: "mock3", newPrice: 75000, vendorName: "Desert Landscape Co", requirementTitle: "Campus Landscaping Project", vendorEmail: "desertland@example.com", requirementId: "req3", submittedAt: new Date().toISOString() },
    { id: "mock4", newPrice: 12000, vendorName: "SecureTech Guards", requirementTitle: "Security Services - Q4", vendorEmail: "securetech@example.com", requirementId: "req4", submittedAt: new Date().toISOString() },
  ];

  const displayQuotes = quotes.length > 0 ? quotes : mockQuotes;

  return (
    <div className="flex flex-col min-h-0 w-full h-full relative">
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="animate-in fade-in space-y-12 duration-500 relative z-10 -mt-6 pt-0">
          <style dangerouslySetInnerHTML={{
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
          `}} />

          {/* Top Fold Container */}
          <div className="flex flex-col min-h-[calc(100vh-7rem)] mb-12">
            {/* Hero Welcome Section */}
            <div className="bg-brand-blue rounded-[2.5rem] flex flex-col px-8 py-10 md:py-16 text-white space-y-8 shadow-sm relative z-40 overflow-hidden mx-2 mt-6 mb-4 flex-1 justify-center">

              {/* Decorative Background Elements with SVG Animation */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white opacity-5 blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400 opacity-10 blur-3xl pointer-events-none"></div>

              {/* SVG Animation */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="hero-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="white" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-pattern)">
                  <animate attributeName="x" from="0" to="-40" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="y" from="0" to="40" dur="2s" repeatCount="indefinite" />
                </rect>
                <rect width="100%" height="100%" fill="url(#hero-gradient)" />
              </svg>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-blue-50 mb-6 backdrop-blur-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Live Sourcing Network
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                      Vendor Management
                    </h1>
                    <p className="text-blue-100/90 text-lg md:text-xl max-w-2xl font-light">
                      Monitor your supply chain, evaluate vendor performance, and manage ongoing requirements in real-time.
                    </p>
                  </div>

                  <Link
                    href="/requirements/new"
                    className="shrink-0 bg-white hover:bg-blue-50 text-brand-blue font-semibold rounded-2xl px-6 py-4 flex items-center gap-3 transition-all shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5"
                  >
                    <div className="bg-blue-100 rounded-full p-1.5">
                      <Plus className="h-5 w-5" />
                    </div>
                    Post Requirement
                  </Link>
                </div>
              </div>

              {/* Quick Stats Over Hero */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8 relative z-10 border-t border-white/10 pt-8">
                <div className="flex flex-col">
                  <p className="text-blue-200 text-sm font-medium mb-1">Active Vendors</p>
                  <p className="text-3xl font-bold tracking-tight">{activeVendors ?? 0}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-blue-200 text-sm font-medium mb-1">Open Requirements</p>
                  <p className="text-3xl font-bold tracking-tight">{openCount ?? 0}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-blue-200 text-sm font-medium mb-1">Pending Reviews</p>
                  <p className="text-3xl font-bold tracking-tight">{counts["SUBMITTED"] ?? 0}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-blue-200 text-sm font-medium mb-1">Closing Soon</p>
                  <p className="text-3xl font-bold tracking-tight text-amber-300">{closingSoon ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Marquee Ticker */}
            {displayQuotes.length > 0 && (
              <div className="mx-2 mb-10 overflow-hidden rounded-full  border-zinc-200 bg-white flex items-center h-10 relative">
                <div className="absolute left-0 z-10 h-full px-3 flex items-center bg-white border-r border-zinc-100 rounded-l-full">
                  <span className="flex h-2 w-2 relative mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Live Bids</span>
                </div>
                <div className="flex whitespace-nowrap animate-marquee items-center pl-32">
                  {[...displayQuotes, ...displayQuotes, ...displayQuotes].map((quote, i) => (
                    <div key={i} className="flex items-center mx-6 text-sm">
                      <span className="font-semibold text-brand-blue">{quote.vendorName || quote.vendorEmail}</span>
                      <span className="mx-2 text-zinc-300">•</span>
                      <span className="text-zinc-600 truncate max-w-[200px]">{quote.requirementTitle}</span>
                      <span className="mx-2 text-zinc-300">•</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(quote.newPrice || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* End of Marquee */}

            {/* Sourcing Overview (4 cards in single row) */}
            <section className="mx-4 md:mx-8 mt-2 mb-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {headline.map((c) => (
                  <KpiCard key={c.label} {...c} />
                ))}
              </div>
            </section>
          </div>
          {/* End of Top Fold Container */}

          <div className="px-4 md:px-8 space-y-12 pb-12">

            {/* Live Bidding & Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left Column: Metrics */}
              <div className="lg:col-span-2 space-y-12">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                      Registrations Pipeline
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
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
              </div>

              {/* Right Column: Live Bidding Updates */}
              <div className="lg:col-span-1">
                <section className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-brand-blue" />
                      Live Bidding
                    </h2>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">Live</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                    {displayQuotes.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <Inbox className="h-10 w-10 text-zinc-300 mb-4" />
                        <p className="text-sm font-medium text-zinc-900">No recent quotes</p>
                        <p className="text-xs text-zinc-500 mt-1">Quotes submitted by vendors will appear here in real-time.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {displayQuotes.map((quote) => (
                          <Link
                            key={quote.id}
                            href={`/requirements/${quote.requirementId}`}
                            className="flex flex-col p-4 hover:bg-zinc-50 transition-colors group"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-sm font-semibold text-zinc-900 group-hover:text-brand-blue transition-colors truncate pr-4">
                                {quote.requirementTitle}
                              </p>
                              <p className="text-sm font-bold text-emerald-600 tabular-nums shrink-0">
                                {formatCurrency(quote.newPrice)}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-zinc-500">
                              <p className="truncate pr-4 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-bold text-zinc-600 shrink-0">
                                  {quote.vendorName.charAt(0).toUpperCase()}
                                </span>
                                {quote.vendorName}
                              </p>
                              <p className="shrink-0">
                                {quote.submittedAt ? timeAgo(quote.submittedAt) : 'Recently'}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    <div className="p-4 bg-zinc-50 border-t border-zinc-100 mt-auto">
                      <Link
                        href="/requirements"
                        className="text-xs font-semibold text-brand-blue flex items-center justify-center gap-1 hover:text-blue-700 transition-colors"
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
                  { name: "Approved", value: counts["APPROVED"] ?? 0, color: "#10b981" },
                  { name: "Pending", value: counts["SUBMITTED"] ?? 0, color: "#f59e0b" },
                  { name: "Rejected", value: counts["REJECTED"] ?? 0, color: "#ef4444" },
                  { name: "Draft", value: counts["DRAFT"] ?? 0, color: "#6b7280" },
                ].filter(d => d.value > 0)}
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                  Supplier Performance Matrix
                </h2>
              </div>
              {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16">
                  <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-zinc-400" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">No active suppliers yet</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Supplier metrics will appear here once sourcing begins.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                    <thead className="bg-brand-blue text-white rounded-xl">
                      <tr>
                        <th className="px-6 py-3 font-semibold rounded-l-xl">Supplier</th>
                        <th className="px-6 py-3 text-right font-semibold">Invited</th>
                        <th className="px-6 py-3 text-right font-semibold">Quoted</th>
                        <th className="px-6 py-3 text-right font-semibold">Response Rate</th>
                        <th className="px-6 py-3 text-right font-semibold">Won</th>
                        <th className="px-6 py-3 text-right font-semibold rounded-r-xl">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p: any, index: number) => (
                        <tr key={p.email} className="bg-white ring-1 ring-inset ring-zinc-200/50 rounded-xl transition-shadow hover:ring-brand-blue group">
                          <td className="px-6 py-4 font-medium text-zinc-900 flex items-center gap-3 rounded-l-xl">
                            {index === 0 && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700 ring-2 ring-white shadow-sm">1</span>}
                            {index === 1 && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 ring-2 ring-white shadow-sm">2</span>}
                            {index === 2 && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800 ring-2 ring-white shadow-sm">3</span>}
                            {index > 2 && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-50 text-xs font-medium text-zinc-400">{index + 1}</span>}
                            <span className="truncate max-w-[200px]">{p.email}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-zinc-600 tabular-nums">
                            {p.invited}
                          </td>
                          <td className="px-6 py-4 text-right text-zinc-600 tabular-nums">
                            {p.submitted}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ${p.invited > 0 && p.responseRate < 50
                                ? "bg-red-50 text-red-700"
                                : "bg-emerald-50 text-emerald-700"
                                }`}
                            >
                              {p.invited === 0 ? "—" : `${p.responseRate}%`}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-zinc-600 tabular-nums">{p.won}</td>
                          <td className="px-6 py-4 text-right text-zinc-600 tabular-nums rounded-r-xl">
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
        </div>
      </div>
    </div>
  );
}
