import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Flame,
  Inbox,
  Layers,
  Sparkles,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { VENDOR_COOKIE } from "@/lib/constants";
import { describeDeadline, summariseVendorDashboard, type VendorRequirementRow } from "@/lib/rfq";
import { getVendorFromSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { vendorApiFetch } from "@/lib/vendor-api";
import { OverviewNextActions } from "@/sections/dashboard/OverviewNextActions";
import { VendorHeroSearch } from "@/sections/dashboard/VendorHeroSearch";
import { LiveRankBadge } from "@/sections/requirements/LiveRankBadge";
import { LiveRankMedal } from "@/sections/requirements/LiveRankMedal";

export const dynamic = "force-dynamic";

type DashboardPayload = {
  registration: {
    id: string;
    status: string;
    referenceNumber: string | null;
    reviewNote: string | null;
    productCategories: string[];
    submittedAt: string | null;
    reviewedAt: string | null;
    email: string;
    businessRelationship: string;
    company: {
      id: string;
      legalName: string;
      dbaName: string | null;
      country: string;
      website: string | null;
      taxIdNumber: string;
      vatNumber: string;
      crNumber: string;
      yearEstablished: number | null;
      dunsNumber: string | null;
    } | null;
    attachments?: Array<{
      id: string;
      fileName: string;
      documentType: string;
      fileSize: number;
      uploadedAt: string | null;
    }>;
    contacts?: Array<{
      id: string;
      fullName: string;
      jobTitle: string | null;
      email: string;
      phone: string | null;
    }>;
  } | null;
  requirements: VendorRequirementRow[];
};

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">{label}</span>
        <div className="bg-brand-blue/10 text-brand-blue flex h-8 w-8 items-center justify-center rounded-xl">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-black tracking-tight text-zinc-950">{value}</span>
      </div>
    </div>
  );
}

export default async function VendorDashboard() {
  const vendor = await getVendorFromSession();
  if (!vendor) return null;
  if (vendor.mustChangePassword) redirect("/password");

  const token = (await cookies()).get(VENDOR_COOKIE)?.value;
  let payload: DashboardPayload = { registration: null, requirements: [] };
  try {
    const res = await vendorApiFetch("/dashboard", { method: "GET", sessionToken: token });
    if (res.ok) {
      const data = await res.json();
      payload = {
        registration: data.registration ?? null,
        requirements: Array.isArray(data.requirements) ? data.requirements : [],
      };
    }
  } catch (err) {
    console.error("[vendor] dashboard fetch failed", err);
  }

  // Sort so active running tenders appear first
  const rawReqs = (payload.requirements || []).sort((a, b) => {
    const aEnded = a.isEnded ? 1 : 0;
    const bEnded = b.isEnded ? 1 : 0;
    if (aEnded !== bEnded) return aEnded - bEnded;
    return new Date(b.closesAt).getTime() - new Date(a.closesAt).getTime();
  });

  const { counts, nextActions } = summariseVendorDashboard({ requirements: rawReqs });
  const registration = payload.registration;
  const companyName = registration?.company?.legalName || vendor.name;

  // Split requirements into real categories
  const runningBids = rawReqs.filter((r) => {
    const isPast = new Date(r.closesAt).getTime() <= Date.now();
    return !isPast && !r.isEnded && r.status === "OPEN";
  });

  const submittedBids = rawReqs.filter((r) => r.quoteStatus === "SUBMITTED");
  const draftBids = rawReqs.filter((r) => r.quoteStatus === "DRAFT");
  const openInvites = rawReqs.filter((r) => (!r.quoteStatus || r.quoteStatus === null) && !r.isEnded && r.status === "OPEN");
  const attachments = registration?.attachments || [];

  const kpis = [
    { label: "Open invitations", value: counts.open, icon: <Inbox className="h-4 w-4" /> },
    { label: "Due in 48h", value: counts.dueSoon, icon: <Clock className="h-4 w-4" /> },
    { label: "Submitted", value: counts.submitted, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: "Drafts", value: counts.drafts, icon: <FileText className="h-4 w-4" /> },
  ];

  // Documents list (mix of verified attachments & templates)
  const docsList =
    attachments.length > 0
      ? attachments.slice(0, 4).map((att, idx) => ({
        id: att.id,
        name: att.fileName,
        type: att.documentType,
        color: [
          "bg-brand-blue",
          "bg-brand-blue/80",
          "bg-brand-blue/60",
          "bg-brand-blue/40",
        ][idx % 4],
        icon: <FileText className="h-4 w-4 text-white" />,
      }))
      : [
        {
          id: "d1",
          name: "Supplier Code of Conduct.pdf",
          type: "Policy",
          color: "bg-brand-blue",
          icon: <FileText className="h-4 w-4 text-white" />,
        },
        {
          id: "d2",
          name: "Standard Procurement Terms.pdf",
          type: "Legal",
          color: "bg-brand-blue/80",
          icon: <FileText className="h-4 w-4 text-white" />,
        },
        {
          id: "d3",
          name: "NDA & Confidentiality.pdf",
          type: "Agreement",
          color: "bg-brand-blue/60",
          icon: <FileText className="h-4 w-4 text-white" />,
        },
        {
          id: "d4",
          name: "E-Invoicing Guidelines.pdf",
          type: "Finance",
          color: "bg-brand-blue/40",
          icon: <FileText className="h-4 w-4 text-white" />,
        },
      ];

  // Messages / Bidding Notifications
  const messages = [
    {
      id: "m1",
      text: "RVCC Procurement invited you to participate in active RFQ bidding.",
      initial: "R",
      color: "bg-brand-blue/10 text-brand-blue",
    },
    {
      id: "m2",
      text: "Real-time blind bidding is active. Monitor your L1 ranking and revise quotes.",
      initial: "B",
      color: "bg-amber-500/10 text-amber-600",
    },
  ];

  return (
    <div className="animate-in fade-in relative z-10 -mt-8 space-y-12 pt-0 duration-500">
      {/* Hero Welcome Section (exact previous height) */}
      <div className="bg-brand-blue relative z-40 mb-10 flex min-h-[calc(100vh-290px)] flex-col items-center justify-center space-y-6 overflow-hidden rounded-b-[2.5rem] px-4 py-8 text-center text-white shadow-sm md:space-y-8 md:py-10">
        {/* Decorative Background Elements */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
          <div
            className="absolute top-1/2 -left-32 h-[240px] w-[500px] -translate-y-1/2 rounded-r-full border-[40px] border-l-0 border-white"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 20%, black 100%)",
              maskImage: "linear-gradient(to right, transparent 20%, black 100%)",
            }}
          />
          <div
            className="absolute -top-12 -right-24 h-[200px] w-[400px] rounded-l-full border-[32px] border-r-0 border-white"
            style={{
              WebkitMaskImage: "linear-gradient(to left, transparent 10%, black 100%)",
              maskImage: "linear-gradient(to left, transparent 10%, black 100%)",
            }}
          />
          <div
            className="absolute -right-32 bottom-8 h-[220px] w-[450px] rounded-l-full border-[40px] border-r-0 border-white"
            style={{
              WebkitMaskImage: "linear-gradient(to left, transparent 10%, black 100%)",
              maskImage: "linear-gradient(to left, transparent 10%, black 100%)",
            }}
          />
        </div>

        <h1 className="relative z-10 mt-8 px-4 text-4xl font-bold tracking-tight text-white drop-shadow-sm md:text-5xl lg:text-6xl">
          Welcome to Vendor Portal!
        </h1>

        {/* Search Bar */}
        <div className="relative z-10 w-full max-w-2xl px-4 pb-4">
          <VendorHeroSearch />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} />
        ))}
      </div>

      {/* Upper Grid (2 cols left + 1 col right) */}
      <div className="grid w-full gap-6 lg:grid-cols-3">
        {/* Left Side (Spans 2 columns) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Latest docs */}
          <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-lg font-bold tracking-tight text-zinc-900">Latest docs</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {docsList.map((doc) => (
                <div
                  key={doc.id}
                  className="hover:border-brand-blue/30 group flex cursor-pointer items-center gap-4 rounded-2xl border border-zinc-100 p-3 transition-colors"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${doc.color} transition-transform group-hover:scale-105`}
                  >
                    {doc.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-700">{doc.name}</p>
                    <p className="text-[10px] text-zinc-400 uppercase font-semibold">{doc.type}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/requirements"
                className="text-brand-blue hover:text-brand-blue/80 text-sm font-bold transition-colors"
              >
                View all
              </Link>
            </div>
          </section>

          {/* Bottom Row inside Left Side (Messages & Next Actions) */}
          <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Latest messages */}
            <section className="flex flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 text-lg font-bold tracking-tight text-zinc-900">
                Latest messages
              </h2>
              <div className="flex-1 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className="border-brand-blue/30 h-4 w-4 rounded-full border-2"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-snug text-zinc-600">{msg.text}</p>
                    </div>
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${msg.color}`}
                    >
                      {msg.initial}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/requirements"
                  className="text-brand-blue hover:text-brand-blue/80 text-sm font-bold transition-colors"
                >
                  View all
                </Link>
              </div>
            </section>

            {/* Your next actions */}
            <section className="flex flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 text-lg font-bold tracking-tight text-zinc-900">
                Your next actions
              </h2>
              <div className="flex-1">
                <OverviewNextActions actions={nextActions} />
              </div>
              <div className="mt-6">
                <Link
                  href="/requirements?tab=invited"
                  className="text-brand-blue hover:text-brand-blue/80 text-sm font-bold transition-colors"
                >
                  View all
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* Right Side: Running Bids with Live Bidding Ranking */}
        <div className="h-full lg:col-span-1">
          <section className="flex h-full flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-lg font-bold tracking-tight text-zinc-900">Running bids</h2>
            <div className="flex-1 space-y-5">
              {runningBids.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-zinc-400">
                  <Flame className="mb-2 h-6 w-6 text-zinc-300" />
                  No live running bids right now.
                </div>
              ) : (
                runningBids.slice(0, 3).map((bid, index) => {
                  const closeDate = new Date(bid.closesAt);
                  const formattedDate = closeDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const deadline = describeDeadline(bid.closesAt);
                  const bgOptions = ["bg-[#3C99DC]", "bg-[#2565AE]", "bg-[#0F5298]"];
                  const bg = bgOptions[index % bgOptions.length];

                  return (
                    <Link
                      key={bid.id}
                      href={`/requirements/${bid.id}`}
                      className={`group flex items-center gap-4.5 ${bg} min-h-[110px] rounded-[22px] p-4.5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md`}
                    >
                      {/* Left: Custom Medal Ranking Circle */}
                      <LiveRankMedal requirementId={bid.id} />

                      {/* Right: Main Box with Project Title, Date, & Status */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-black text-white text-base tracking-tight group-hover:text-white/95">
                          {bid.project}
                        </h3>

                        {/* Date & Deadline Info */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/90">
                          <span
                            suppressHydrationWarning
                            className="inline-flex items-center gap-1 rounded-md bg-black/15 px-2 py-0.5 backdrop-blur-xs"
                          >
                            <Calendar className="h-3 w-3 text-white/80" />
                            {formattedDate}
                          </span>
                          <span className="text-white/70">·</span>
                          <span suppressHydrationWarning className="text-white/90 font-bold">
                            {deadline.label}
                          </span>
                        </div>

                        {bid.newPrice && (
                          <p className="mt-1.5 text-[11px] font-bold text-white/95 tabular-nums">
                            Your Bid: {Number(bid.newPrice).toLocaleString()} {bid.currency}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            <div className="mt-8">
              <Link
                href="/requirements?tab=running"
                className="text-brand-blue hover:text-brand-blue/80 text-sm font-bold transition-colors"
              >
                View all
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* 3 Item Lists matching the KPIs with Real Data & Ranking */}
      <div className="grid w-full gap-6 lg:grid-cols-3">
        {/* 1. Open Invitations */}
        <section className="flex min-h-[400px] flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-brand-blue/10 text-brand-blue flex h-8 w-8 items-center justify-center rounded-lg">
              <Inbox className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Open invitations</h2>
          </div>
          <div className="flex-1 space-y-4">
            {openInvites.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No open unquoted invitations.</p>
            ) : (
              openInvites.slice(0, 3).map((item) => {
                const deadline = describeDeadline(item.closesAt);
                return (
                  <Link
                    key={item.id}
                    href={`/requirements/${item.id}`}
                    className="hover:border-brand-blue/30 group flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-100 bg-white p-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="group-hover:bg-brand-blue h-2 w-2 rounded-full bg-blue-400 transition-colors"></div>
                      <div>
                        <h3 className="group-hover:text-brand-blue text-sm font-bold text-zinc-900 transition-colors">
                          {item.project}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">{deadline.label}</p>
                      </div>
                    </div>
                    <div className="rounded-md bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-brand-blue">
                      Bid Now
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <Link
              href="/requirements?tab=invited"
              className="text-brand-blue hover:text-brand-blue/80 inline-flex items-center gap-1 text-sm font-bold transition-colors"
            >
              View all open invitations <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* 2. Submitted with Live Bidding Ranking */}
        <section className="flex min-h-[400px] flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-brand-blue/10 text-brand-blue flex h-8 w-8 items-center justify-center rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Submitted</h2>
          </div>
          <div className="flex-1 space-y-4">
            {submittedBids.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No bids submitted yet.</p>
            ) : (
              submittedBids.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/requirements/${item.id}`}
                  className="group flex cursor-pointer items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 transition-all hover:border-emerald-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    <div>
                      <h3 className="group-hover:text-brand-blue text-sm font-bold text-zinc-900 transition-colors">
                        {item.project}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.newPrice ? `${Number(item.newPrice).toLocaleString()} ${item.currency || "SAR"}` : "Quote Submitted"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LiveRankBadge requirementId={item.id} />
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <Link
              href="/requirements?tab=submitted"
              className="text-brand-blue hover:text-brand-blue/80 inline-flex items-center gap-1 text-sm font-bold transition-colors"
            >
              View all submitted <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* 3. Drafts */}
        <section className="flex min-h-[400px] flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-brand-blue/10 text-brand-blue flex h-8 w-8 items-center justify-center rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Drafts</h2>
          </div>
          <div className="flex-1 space-y-4">
            {draftBids.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No saved draft quotes.</p>
            ) : (
              draftBids.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/requirements/${item.id}`}
                  className="group flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-all hover:border-zinc-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-zinc-300"></div>
                    <div>
                      <h3 className="group-hover:text-brand-blue text-sm font-bold text-zinc-900 transition-colors">
                        {item.project}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">Draft saved</p>
                    </div>
                  </div>
                  <div className="group-hover:text-brand-blue text-zinc-400 transition-colors">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <Link
              href="/requirements?tab=drafts"
              className="text-brand-blue hover:text-brand-blue/80 inline-flex items-center gap-1 text-sm font-bold transition-colors"
            >
              Continue drafts <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
