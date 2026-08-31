import {
  Briefcase,
  ChevronLeft,
  CircleDashed,
  Clock,
  Edit2,
  Lock,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { rankQuotes } from "@/lib/rfq";
import { QuotesSection } from "@/sections/requirements/QuotesSection";

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

function Section({
  title,
  icon: Icon,
  children,
  badge,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="text-brand-blue h-5 w-5" />}
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">{title}</h2>
        </div>
        {badge && badge}
      </div>
      <div className="flex-1 bg-white p-6">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col border-b border-zinc-50 py-3 pt-0 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-start">
      <dt className="mb-1 w-full text-sm text-[11px] font-semibold tracking-wider text-zinc-500 uppercase sm:mb-0 sm:w-1/3 sm:pt-0.5">
        {label}
      </dt>
      <dd className="w-full text-sm leading-relaxed font-medium text-zinc-900 sm:w-2/3">{value}</dd>
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
        <div className="relative flex h-3 w-3 items-center justify-center">
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
      <span className="bg-brand-blue/10 text-brand-blue inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
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
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {/* Static header skeleton */}
      <div className="z-10 flex flex-none items-center justify-between bg-white px-6 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-6 w-64" />
        </div>
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 md:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <Section title="Requirement Details" icon={Briefcase}>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start py-3">
                    <Skeleton className="mt-1 h-3 w-24" />
                    <Skeleton className="ml-auto h-4 w-48" />
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Invited Vendors" icon={Users}>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-zinc-100 pb-4"
                  >
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Quotes skeleton */}
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-zinc-200 p-4">
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
      .map((q) => {
        const email = q.vendorUser?.email || (q as any).participantEmail || "vendor@example.com";
        const name = q.vendorUser?.name || (q as any).participantName || email;
        return {
          id: q.id,
          newPrice: String(q.newPrice),
          remarks: q.remarks,
          submittedAt: q.submittedAt ? new Date(q.submittedAt) : null,
          who: name,
          vendorEmail: email,
          quoteFileUrl: q.quoteFileUrl,
        };
      })
  );

  const drafts = quotes.filter((q) => q.status !== "SUBMITTED");

  return (
    <>
      {/* Fixed Sticky Header */}
      <div className="z-10 flex flex-none items-center justify-between bg-white px-6 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/requirements"
            className="focus-visible:ring-brand-blue flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:outline-none"
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
            className="hover:border-brand-blue hover:text-brand-blue focus:ring-brand-blue/30 inline-flex h-9 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-all focus:ring-[3px]"
          >
            <Edit2 className="h-4 w-4" />
            Edit Requirement
          </Link>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 [scrollbar-width:none] overflow-y-auto bg-zinc-50/50 p-6 [-ms-overflow-style:none] md:p-8 [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
          {req.awardedAt && (
            <div className="flex items-center gap-4 rounded-2xl border border-green-200/80 bg-green-50 p-5 text-sm text-green-900 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100/80">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="mb-0.5 text-base font-bold tracking-tight">Requirement Awarded</p>
                <p className="font-medium text-green-700/80">
                  Awarded on {formatDateTime(req.awardedAt)}
                  {req.awardedByAdmin ? ` by ${req.awardedByAdmin.email}` : ""}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <Section title="Requirement Details" icon={Briefcase}>
              <dl>
                <Row
                  label="Reference ID"
                  value={
                    <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-zinc-600">
                      {req.referenceNumber ?? "— draft —"}
                    </span>
                  }
                />
                <Row
                  label="Scope of Work"
                  value={<span className="whitespace-pre-wrap">{req.scopeOfWork}</span>}
                />
                <Row label="Posted Date" value={formatDateTime(req.createdAt)} />
                <Row label="Closes Date" value={formatDateTime(req.closesAt)} />
                <Row
                  label="Selling Price"
                  value={
                    req.sellingPrice != null ? (
                      <span className="text-brand-blue bg-brand-blue/5 border-brand-blue/10 rounded-md border px-2.5 py-1 font-bold tabular-nums">{`${req.sellingPrice} ${req.currency}`}</span>
                    ) : (
                      "Not set"
                    )
                  }
                />
              </dl>
            </Section>

            <Section
              title="Invited Vendors"
              icon={Users}
              badge={
                <span className="rounded-full bg-zinc-200/70 px-2.5 py-0.5 text-xs font-bold text-zinc-700">
                  {invites.length}
                </span>
              }
            >
              {invites.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50">
                    <Users className="h-5 w-5 text-zinc-300" />
                  </div>
                  <p className="text-sm font-medium text-zinc-400">No vendors invited.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {invites.map((i) => (
                    <li
                      key={i.id}
                      className="flex flex-col gap-1.5 border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-1 text-sm font-bold text-zinc-800">
                          {i.vendorUser?.email || (i as any).email || "—"}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
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
