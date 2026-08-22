import { notFound } from "next/navigation";
import { Lock, CircleDashed, Trophy, XCircle, Clock, Edit2 } from "lucide-react";

import { rankQuotes } from "@/lib/rfq";
import { BackButton } from "@/components/ui/back-button";
import { adminSessionJson } from "@/lib/admin-data";
import { AwardButton } from "@/sections/AwardButton";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | React.ReactNode | null }) {
  return (
    <div className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-3 last:border-0">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm break-words font-medium text-zinc-950">{value || "—"}</dd>
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

export default async function RequirementComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      }))
  );
  
  const drafts = quotes.filter((q) => q.status !== "SUBMITTED");
  const isClosed = new Date(req.closesAt).getTime() <= Date.now();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto min-h-0 pr-2 pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to requirements" />
        <button className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-blue/25">
          <Edit2 className="h-4 w-4" />
          Edit Requirement
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
              {req.project}
            </h1>
            {statusBadge(req.status, req.closesAt)}
          </div>
          <p className="mt-2 text-sm text-zinc-500 font-mono">
            {req.referenceNumber ?? "— draft —"}
          </p>
        </div>
      </div>

      {req.awardedAt && (
        <div className="rounded-2xl border border-green-200/50 bg-green-50/50 p-4 text-sm text-green-900 flex items-center gap-3">
          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold">Requirement Awarded</p>
            <p className="text-green-700">
              Awarded on {formatDateTime(req.awardedAt)}
              {req.awardedByAdmin ? ` by ${req.awardedByAdmin.email}` : ""}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <Section title="Details">
          <dl>
            <Row label="Scope of Work" value={<span className="whitespace-pre-wrap">{req.scopeOfWork}</span>} />
            <Row label="Posted Date" value={formatDateTime(req.createdAt)} />
            <Row label="Closes Date" value={formatDateTime(req.closesAt)} />
            <Row 
              label="Selling Price" 
              value={req.sellingPrice != null ? <span className="tabular-nums">{`${req.sellingPrice} ${req.currency}`}</span> : "Not set"} 
            />
          </dl>
        </Section>
        
        <Section title={`Invited Vendors (${invites.length})`}>
          {invites.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6 border-2 border-dashed border-zinc-100 rounded-xl">No vendors invited.</p>
          ) : (
            <ul className="space-y-3">
              {invites.map((i) => (
                <li key={i.id} className="flex flex-col gap-1.5 pb-3 border-b border-zinc-100 last:border-0 last:pb-0">
                  <span className="text-sm font-medium text-zinc-900 line-clamp-1">{i.vendorUser.email}</span>
                  <span
                    className={`self-start text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                      i.emailStatus === "FAILED"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {i.emailStatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-semibold text-zinc-950">Quotes Received</h2>
          <span className="bg-zinc-100 text-zinc-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {ranked.length} Submitted
          </span>
          {drafts.length > 0 && (
            <span className="bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {drafts.length} Drafts
            </span>
          )}
        </div>

        {ranked.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-12 text-center">
            <h3 className="text-sm font-semibold text-zinc-900">No submitted quotes yet</h3>
            <p className="mt-1 text-sm text-zinc-500">
              When vendors submit their quotes, they will appear here, ranked automatically by price.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {ranked.map((q) => {
              const isWinner = req.awardedQuoteId === q.id;
              return (
                <div 
                  key={q.id} 
                  className={`flex flex-col p-6 rounded-2xl border transition-all ${
                    isWinner 
                      ? 'border-brand-blue bg-blue-50/30 shadow-md ring-1 ring-brand-blue/20' 
                      : 'border-zinc-200 bg-white hover:border-brand-blue/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isWinner ? 'bg-brand-blue text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                        #{q.rank}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900 line-clamp-1">{q.who}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{q.vendorEmail}</p>
                      </div>
                    </div>
                    {isWinner && (
                      <span className="flex items-center gap-1 bg-brand-blue text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0">
                        <Trophy className="h-3 w-3" />
                        Winner
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-5 border-t border-zinc-100 space-y-4">
                    <div className="flex items-end justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Quoted Price</span>
                      <span className="text-2xl font-bold text-zinc-900 tabular-nums tracking-tight">
                        {q.newPrice} <span className="text-sm font-semibold text-zinc-500">{req.currency}</span>
                      </span>
                    </div>
                    
                    {q.remarks && (
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">Remarks</span>
                        <p className="text-sm text-zinc-700 italic bg-zinc-50 p-3 rounded-lg border border-zinc-100/80">
                          "{q.remarks}"
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-medium text-zinc-400">
                        {q.submittedAt ? formatDateTime(q.submittedAt.toISOString()) : "—"}
                      </span>
                      
                      {!req.awardedQuoteId && (
                        <AwardButton
                          requirementId={req.id}
                          quoteId={q.id}
                          vendorLabel={q.vendorEmail}
                          price={q.newPrice}
                          currency={req.currency}
                          project={req.project}
                          closesAt={req.closesAt}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
