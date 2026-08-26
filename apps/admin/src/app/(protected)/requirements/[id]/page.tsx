import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, CircleDashed, Trophy, XCircle, Clock, Edit2, FileText, ChevronLeft, MapPin, Briefcase, FileSignature, Box, Users } from "lucide-react";

import { rankQuotes } from "@/lib/rfq";
import { adminSessionJson } from "@/lib/admin-data";
import { QuotesSection } from "@/sections/QuotesSection";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

function formatDateTime(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Section({ title, icon: Icon, children, badge }: { title: string; icon?: any; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="h-5 w-5 text-brand-blue" />}
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">{title}</h2>
        </div>
        {badge && badge}
      </div>
      <div className="p-6 flex-1 bg-white">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-zinc-50 last:border-0 last:pb-0 pt-0 first:pt-0">
      <dt className="w-full sm:w-1/3 text-sm font-semibold text-zinc-500 uppercase tracking-wider text-[11px] mb-1 sm:mb-0 sm:pt-0.5">{label}</dt>
      <dd className="w-full sm:w-2/3 text-sm text-zinc-900 font-medium leading-relaxed">{value}</dd>
    </div>
  );
}

function statusBadge(status: string, closesAt: string | null) {
  const isExpired = closesAt && new Date(closesAt).getTime() <= Date.now();

  if (status === "OPEN" && isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
        <Lock className="h-3.5 w-3.5" />
        Closed
      </span>
    );
  }
  
  if (status === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
        <div className="relative flex items-center justify-center h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </div>
        Open
      </span>
    );
  }

  if (status === "DRAFT") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
        <CircleDashed className="h-3.5 w-3.5" />
        Draft
      </span>
    );
  }

  if (status === "AWARDED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue">
        <Trophy className="h-3.5 w-3.5" />
        Awarded
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
        <XCircle className="h-3.5 w-3.5" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
      <Clock className="h-3.5 w-3.5" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton fallbacks                                                  */
/* ------------------------------------------------------------------ */

function RequirementDetailSkeleton() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full relative">
      {/* Static header skeleton */}
      <div className="flex-none flex items-center justify-between bg-white px-6 pb-4 pt-4 z-10">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-6 w-64" />
        </div>
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 md:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <Section title="Requirement Details" icon={Briefcase}>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start py-3">
                    <Skeleton className="h-3 w-24 mt-1" />
                    <Skeleton className="h-4 w-48 ml-auto" />
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Invited Vendors" icon={Users}>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between pb-4 border-b border-zinc-100">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Quotes skeleton */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-zinc-200 p-4 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Payload = {
  requirement: {
    id: string;
    referenceNumber: string | null;
    scopeOfWork: string;
    project: string;
    sellingPrice: string | number | null;
    currency: string;
    closesAt: string;
    status: string;
    createdAt: string;
    awardedAt: string | null;
    awardedQuoteId: string | null;
    awardedByAdmin: { email: string } | null;
  };
  quotes: Array<{
    id: string;
    newPrice: string | number;
    remarks: string | null;
    quoteFileUrl: string | null;
    status: string;
    submittedAt: string | null;
    vendorUser: { email: string; name: string | null };
  }>;
  invites: Array<{
    id: string;
    emailStatus: string;
    vendorUser: { email: string };
  }>;
};

/* ------------------------------------------------------------------ */
/*  Async data component (streamed via Suspense)                       */
/* ------------------------------------------------------------------ */

async function RequirementData({ id }: { id: string }) {
  const result = await adminSessionJson<Payload>(`/requirements/${encodeURIComponent(id)}`);
  
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        Could not load requirement ({result.status}).
      </p>
    );
  }

  const { requirement: req, quotes, invites } = result.data;

  const ranked = rankQuotes(
    quotes
      .filter((q) => q.status === "SUBMITTED")
      .map((q) => ({
        id: q.id,
        newPrice: String(q.newPrice),
        remarks: q.remarks,
        submittedAt: q.submittedAt ? new Date(q.submittedAt) : null,
        who: q.vendorUser.name || q.vendorUser.email,
        vendorEmail: q.vendorUser.email,
        quoteFileUrl: q.quoteFileUrl,
      }))
  );
  
  const drafts = quotes.filter((q) => q.status !== "SUBMITTED");

  return (
    <>
      {/* Fixed Sticky Header */}
      <div className="flex-none flex items-center justify-between bg-white px-6 pb-4 pt-4 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/requirements"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">{req.project}</h1>
            {statusBadge(req.status, req.closesAt)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/requirements/${req.id}/edit`}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:border-brand-blue hover:text-brand-blue focus:ring-[3px] focus:ring-brand-blue/30"
          >
            <Edit2 className="h-4 w-4" />
            Edit Requirement
          </Link>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
          
          {req.awardedAt && (
            <div className="rounded-2xl border border-green-200/80 bg-green-50 p-5 text-sm text-green-900 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 bg-green-100/80 rounded-full flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-base tracking-tight mb-0.5">Requirement Awarded</p>
                <p className="text-green-700/80 font-medium">
                  Awarded on {formatDateTime(req.awardedAt)}
                  {req.awardedByAdmin ? ` by ${req.awardedByAdmin.email}` : ""}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <Section title="Requirement Details" icon={Briefcase}>
              <dl>
                <Row label="Reference ID" value={<span className="font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">{req.referenceNumber ?? "— draft —"}</span>} />
                <Row label="Scope of Work" value={<span className="whitespace-pre-wrap">{req.scopeOfWork}</span>} />
                <Row label="Posted Date" value={formatDateTime(req.createdAt)} />
                <Row label="Closes Date" value={formatDateTime(req.closesAt)} />
                <Row 
                  label="Selling Price" 
                  value={req.sellingPrice != null ? <span className="tabular-nums font-bold text-brand-blue bg-brand-blue/5 px-2.5 py-1 rounded-md border border-brand-blue/10">{`${req.sellingPrice} ${req.currency}`}</span> : "Not set"} 
                />
              </dl>
            </Section>
            
            <Section title="Invited Vendors" icon={Users} badge={<span className="bg-zinc-200/70 text-zinc-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{invites.length}</span>}>
              {invites.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3 border border-zinc-100">
                    <Users className="h-5 w-5 text-zinc-300" />
                  </div>
                  <p className="text-sm font-medium text-zinc-400">No vendors invited.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {invites.map((i) => (
                    <li key={i.id} className="flex flex-col gap-1.5 pb-4 border-b border-zinc-100 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-zinc-800 line-clamp-1">{i.vendorUser.email}</span>
                        <span
                          className={`shrink-0 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                            i.emailStatus === "FAILED"
                              ? "bg-rose-100 text-rose-700"
                              : i.emailStatus === "SENT"
                              ? "bg-green-100 text-green-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {i.emailStatus}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <QuotesSection 
            ranked={ranked} 
            draftsCount={drafts.length} 
            req={{
              id: req.id,
              currency: req.currency,
              project: req.project,
              closesAt: req.closesAt,
              awardedQuoteId: req.awardedQuoteId,
            }} 
          />
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (static shell + streamed data)                                */
/* ------------------------------------------------------------------ */

export default async function RequirementComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<RequirementDetailSkeleton />}>
      <RequirementData id={id} />
    </Suspense>
  );
}
