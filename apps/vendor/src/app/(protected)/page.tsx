import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
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
import { VendorHeroSearch } from "@/sections/dashboard/VendorHeroSearch";
import { LiveRankBadge } from "@/sections/requirements/LiveRankBadge";

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
  href,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  colorClass: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6",
        "hover:border-brand-blue/30"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">{label}</span>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", colorClass)}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-black tracking-tight text-zinc-950">{value}</span>
        <span className="text-brand-blue inline-flex items-center gap-0.5 text-xs font-bold opacity-0 transition-opacity group-hover:opacity-100">
          View <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
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

  const rawReqs = payload.requirements || [];
  const { counts, nextActions } = summariseVendorDashboard({ requirements: rawReqs });
  const registration = payload.registration;
  const companyName = registration?.company?.legalName || vendor.name;

  // Split real requirements into categories
  const runningBids = rawReqs.filter((r) => {
    const isPast = new Date(r.closesAt).getTime() <= Date.now();
    return !isPast && r.quoteStatus !== "SUBMITTED";
  });

  const submittedBids = rawReqs.filter((r) => r.quoteStatus === "SUBMITTED");
  const draftBids = rawReqs.filter((r) => r.quoteStatus === "DRAFT");
  const openInvites = rawReqs.filter((r) => !r.quoteStatus || r.quoteStatus === null);
  const attachments = registration?.attachments || [];

  const kpis = [
    {
      label: "Total RFQs",
      value: rawReqs.length,
      icon: <Layers className="h-4 w-4 text-brand-blue" />,
      href: "/requirements?tab=all",
      colorClass: "bg-blue-50 text-brand-blue",
    },
    {
      label: "Running Bids",
      value: runningBids.length,
      icon: <Flame className="h-4 w-4 text-amber-500" />,
      href: "/requirements?tab=running",
      colorClass: "bg-amber-50 text-amber-600",
    },
    {
      label: "Action Required",
      value: openInvites.length,
      icon: <Inbox className="h-4 w-4 text-blue-500" />,
      href: "/requirements?tab=invited",
      colorClass: "bg-sky-50 text-sky-600",
    },
    {
      label: "Submitted Bids",
      value: submittedBids.length,
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      href: "/requirements?tab=submitted",
      colorClass: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="animate-in fade-in relative z-10 -mt-8 space-y-10 pt-0 duration-500">
      {/* Hero Welcome Section */}
      <div className="bg-brand-blue relative z-40 mb-8 flex min-h-[260px] flex-col items-center justify-center space-y-4 overflow-hidden rounded-b-[2.5rem] px-4 py-8 text-center text-white shadow-sm md:py-10">
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
        </div>

        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Certified Supplier Workspace
          </span>
          <h1 className="px-4 text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
            Welcome back, {companyName}!
          </h1>
          <p className="mx-auto max-w-xl text-xs text-white/80 sm:text-sm">
            Manage your tender participations, review itemized BOQs, enter live blind auctions, and
            track L1 awards in real time.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 w-full max-w-2xl px-4 pt-2">
          <VendorHeroSearch />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            href={kpi.href}
            colorClass={kpi.colorClass}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid w-full gap-6 lg:grid-cols-3">
        {/* Left Side: Real Open Requirements & Next Actions (Spans 2 columns) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Action Required: Tender Invitations */}
          <section className="flex flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-brand-blue/10 text-brand-blue flex h-9 w-9 items-center justify-center rounded-xl">
                  <Inbox className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                    Action Required / Tender Invites
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Tenders from RVCC awaiting your commercial response
                  </p>
                </div>
              </div>
              <Link
                href="/requirements?tab=invited"
                className="text-brand-blue hover:text-brand-blue/80 inline-flex items-center gap-1 text-xs font-bold"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {openInvites.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-zinc-800">All caught up!</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  You have no pending RFQ invitations waiting for initial response.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {openInvites.slice(0, 4).map((item) => {
                  const deadline = describeDeadline(item.closesAt);
                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-4 transition-all hover:border-brand-blue/30 hover:shadow-sm sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-zinc-500">
                            {item.referenceNumber || "RFQ-PENDING"}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                            New Invite
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-zinc-900 group-hover:text-brand-blue transition-colors">
                          {item.project}
                        </h3>
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                          {item.scopeOfWork}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className={cn("h-3.5 w-3.5", deadline.urgent ? "text-amber-500" : "")} />
                          <span className={deadline.urgent ? "font-bold text-amber-600" : ""}>
                            {deadline.label}
                          </span>
                        </div>
                        <Link
                          href={`/requirements/${item.id}`}
                          className="bg-brand-blue hover:bg-brand-blue/90 inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
                        >
                          <span>Bid Now</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Submitted Bids & Evaluations */}
          <section className="flex flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-600 flex h-9 w-9 items-center justify-center rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                    Active Bids Under Evaluation
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Quotes submitted with real-time L1 market positioning
                  </p>
                </div>
              </div>
              <Link
                href="/requirements?tab=submitted"
                className="text-brand-blue hover:text-brand-blue/80 inline-flex items-center gap-1 text-xs font-bold"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {submittedBids.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
                <FileText className="h-8 w-8 text-zinc-400 mb-2" />
                <p className="text-sm font-bold text-zinc-800">No submitted bids yet</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  When you submit commercial quotes for RFQs, your bids and rank will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {submittedBids.slice(0, 4).map((bid) => {
                  const deadline = describeDeadline(bid.closesAt);
                  return (
                    <div
                      key={bid.id}
                      className="group flex flex-col justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 transition-all hover:border-emerald-200 hover:shadow-sm sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-zinc-500">
                            {bid.referenceNumber || "RFQ-SUBMITTED"}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Submitted
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-zinc-900 group-hover:text-brand-blue transition-colors">
                          {bid.project}
                        </h3>
                        <div className="mt-1 flex items-center gap-3 text-xs">
                          <span className="font-bold text-zinc-900">
                            Your Quote: {bid.newPrice ? `${Number(bid.newPrice).toLocaleString()} ${bid.currency || "SAR"}` : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                        <LiveRankBadge requirementId={bid.id} />
                        <Link
                          href={`/requirements/${bid.id}`}
                          className="border border-zinc-200 bg-white hover:bg-zinc-50 inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold text-zinc-800 shadow-sm transition-all"
                        >
                          <span>Review / Revise</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Supplier Compliance & Registration Dossier */}
          {registration && (
            <section className="flex flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-50 text-purple-600 flex h-9 w-9 items-center justify-center rounded-xl">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                      Company Profile & Verified Documents
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Legal registration details and compliance attachments
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  {registration.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-zinc-50/70 p-4 sm:grid-cols-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">CR Number</span>
                  <p className="font-mono text-xs font-bold text-zinc-900 mt-0.5">{registration.company?.crNumber || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">VAT Number</span>
                  <p className="font-mono text-xs font-bold text-zinc-900 mt-0.5">{registration.company?.vatNumber || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Country</span>
                  <p className="text-xs font-bold text-zinc-900 mt-0.5">{registration.company?.country || "Saudi Arabia"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tracking Ref</span>
                  <p className="font-mono text-xs font-bold text-brand-blue mt-0.5">{registration.referenceNumber || "—"}</p>
                </div>
              </div>

              {attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">Verified Attachments</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {attachments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-xs"
                      >
                        <div className="bg-brand-blue/10 text-brand-blue flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-zinc-900">{doc.fileName}</p>
                          <p className="text-[10px] text-zinc-500 uppercase">{doc.documentType} · {(doc.fileSize / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Side: Running Bids & Live Countdown (1 column) */}
        <div className="h-full lg:col-span-1">
          <section className="flex h-full flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 text-amber-600 flex h-9 w-9 items-center justify-center rounded-xl">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-900">Running Bids</h2>
                  <p className="text-xs text-zinc-500">Live auctions in progress</p>
                </div>
              </div>
              <Link
                href="/requirements?tab=running"
                className="text-brand-blue hover:text-brand-blue/80 text-xs font-bold"
              >
                View all
              </Link>
            </div>

            {runningBids.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center">
                <Flame className="h-7 w-7 text-zinc-400 mb-2" />
                <p className="text-sm font-bold text-zinc-800">No active live bids</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  When new live RFQs are published, they will appear with live countdowns here.
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-4">
                {runningBids.slice(0, 4).map((bid, index) => {
                  const deadline = describeDeadline(bid.closesAt);
                  const closeDate = new Date(bid.closesAt);
                  const month = closeDate.toLocaleDateString("en-US", { month: "short" });
                  const day = closeDate.getDate();
                  const colors = [
                    "bg-[#0284c7] text-white",
                    "bg-[#0369a1] text-white",
                    "bg-[#0f172a] text-white",
                  ];
                  const bgClass = colors[index % colors.length];

                  return (
                    <Link
                      key={bid.id}
                      href={`/requirements/${bid.id}`}
                      className={cn(
                        "group flex items-center gap-4 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02]",
                        bgClass
                      )}
                    >
                      {/* Clean White Date Box */}
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm">
                        <span className="text-[10px] font-black tracking-wider text-zinc-900 uppercase">
                          {month}
                        </span>
                        <span className="text-xl font-black leading-none text-zinc-900">{day}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-[10px] font-semibold text-white/80">
                          {bid.referenceNumber || "LIVE-RFQ"}
                        </span>
                        <h3 className="truncate text-sm font-bold text-white group-hover:underline">
                          {bid.project}
                        </h3>
                        <p className="mt-0.5 text-xs font-medium text-white/90">
                          {deadline.label}
                        </p>
                      </div>

                      <ArrowRight className="h-4 w-4 shrink-0 text-white opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="mt-6 border-t border-zinc-100 pt-4">
              <Link
                href="/requirements"
                className="text-brand-blue hover:text-brand-blue/80 flex items-center justify-between text-xs font-bold transition-colors"
              >
                <span>Browse All Sourcing Opportunities</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
