"use client";

import {
  AlertCircle,
  ArrowUpDown,
  Calculator,
  Calendar,
  ChevronDown,
  FileText,
  Medal,
  Sigma,
  Trophy,
} from "lucide-react";
import { useState } from "react";

import { useAdminLiveBidding } from "@/hooks/use-admin-live-bidding";

import { AwardButton } from "./AwardButton";
import { LiveBiddingGraph } from "./LiveBiddingGraph";

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

type QuoteInfo = {
  id: string;
  rank: number;
  newPrice: string;
  remarks: string | null;
  quoteFileUrl?: string | null;
  submittedAt: Date | null;
  who: string;
  vendorEmail: string;
};

type SortOption = "price-asc" | "price-desc" | "date-desc" | "date-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "price-asc", label: "Lowest Price First" },
  { value: "price-desc", label: "Highest Price First" },
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
];

export function QuotesSection({
  ranked,
  draftsCount,
  req,
}: {
  ranked: QuoteInfo[];
  draftsCount: number;
  req: {
    id: string;
    currency: string;
    project: string;
    closesAt: string;
    awardedQuoteId: string | null;
  };
}) {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [sort, setSort] = useState<SortOption>("price-asc");
  const [sortOpen, setSortOpen] = useState(false);

  // Live real-time stream subscription (SSE)
  const { data: liveData, status: liveStatus, errorMsg } = useAdminLiveBidding(req.id);

  // Convert live quotes or fallback to initial SSR ranked data
  const currentRanked: QuoteInfo[] = liveData?.quotes
    ? liveData.quotes.map((q) => ({
        id: q.id,
        rank: q.rank,
        newPrice: q.newPrice,
        remarks: q.remarks,
        quoteFileUrl: q.quoteFileUrl,
        submittedAt: q.submittedAt ? new Date(q.submittedAt) : null,
        who: q.who,
        vendorEmail: q.vendorEmail,
      }))
    : ranked;

  // Sorting logic
  const sortedQuotes = [...currentRanked].sort((a, b) => {
    if (sort === "price-asc") {
      return Number(a.newPrice) - Number(b.newPrice);
    }
    if (sort === "price-desc") {
      return Number(b.newPrice) - Number(a.newPrice);
    }
    if (sort === "date-desc") {
      const timeA = a.submittedAt?.getTime() || 0;
      const timeB = b.submittedAt?.getTime() || 0;
      return timeB - timeA;
    }
    if (sort === "date-asc") {
      const timeA = a.submittedAt?.getTime() || 0;
      const timeB = b.submittedAt?.getTime() || 0;
      return timeA - timeB;
    }
    return 0;
  });

  // Calculate Metrics (Live or Initial)
  const totalQuotes = liveData?.totalQuotes ?? currentRanked.length;
  const averagePrice =
    liveData?.averagePrice ??
    (totalQuotes > 0
      ? (currentRanked.reduce((acc, q) => acc + Number(q.newPrice), 0) / totalQuotes).toFixed(2)
      : "0.00");

  return (
    <section>
      {/* Metrics Boxes */}
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
          <div className="via-brand-blue/25 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
              Total Quotes
            </p>
            <div className="bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 group-hover:text-white">
              <Sigma className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
            <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
              {totalQuotes}
            </p>
          </div>
        </div>
        <div className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
          <div className="via-brand-blue/25 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
              Avg. Quoted Price
            </p>
            <div className="bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 group-hover:text-white">
              <Calculator className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
            <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
              {averagePrice}{" "}
              <span className="text-sm font-semibold text-zinc-400">{req.currency}</span>
            </p>
          </div>
        </div>
        <div className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
          <div className="via-brand-blue/25 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
              Ending Date
            </p>
            <div className="bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 group-hover:text-white">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
            <p className="text-xl font-bold tracking-tight text-zinc-950">
              {formatDateTime(req.closesAt)}
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-red-600">
            <AlertCircle className="h-5 w-5" />
            Live Market Error: {errorMsg}
          </p>
        </div>
      )}

      {/* Main Container for Side-by-Side View */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column: Quotes List (Price and Vendor Name) */}
        <div className="flex h-full max-h-[550px] flex-col">
          <div className="mb-4 flex shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-950">
                Quotes Received
              </h2>
              {draftsCount > 0 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-600 uppercase">
                  {draftsCount} Drafts
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Custom Sort Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setSortOpen((prev) => !prev)}
                  onBlur={() => setTimeout(() => setSortOpen(false), 200)}
                  className="focus-visible:ring-brand-blue/25 hover:border-brand-blue flex min-w-[150px] items-center justify-between gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pr-2.5 pl-3 text-xs font-semibold text-zinc-700 shadow-sm transition-all outline-none focus-visible:ring-[2px]"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                </button>

                {sortOpen && (
                  <div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg">
                    {SORT_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSort(o.value);
                          setSortOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-xs transition-colors ${
                          o.value === sort
                            ? "text-brand-blue bg-zinc-50 font-bold"
                            : "font-medium text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {sortedQuotes.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-white/50 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50">
                <Trophy className="h-8 w-8 text-zinc-300" />
              </div>
              <h3 className="text-base font-bold tracking-tight text-zinc-900">
                No submitted quotes
              </h3>
              <p className="mx-auto mt-1.5 max-w-[250px] text-sm text-zinc-500">
                When vendors submit their quotes, they will appear here.
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 [scrollbar-width:none] space-y-3 overflow-y-auto pr-2 pb-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {sortedQuotes.map((q) => {
                const isWinner = req.awardedQuoteId === q.id;
                return (
                  <div
                    key={q.id}
                    className={`flex flex-col rounded-2xl border p-4 transition-all sm:p-5 ${
                      isWinner
                        ? "border-brand-blue ring-brand-blue/10 bg-blue-50/20 shadow-sm ring-1"
                        : "hover:border-brand-blue/30 border-zinc-200 bg-white hover:-translate-y-0.5 hover:shadow-sm"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isWinner ? "bg-brand-blue text-white shadow-sm" : "bg-zinc-100 text-zinc-600"}`}
                        >
                          {q.rank === 1 ? (
                            <Medal className="h-5 w-5 text-yellow-500 drop-shadow-sm" />
                          ) : q.rank === 2 ? (
                            <Medal className="h-5 w-5 text-slate-400 drop-shadow-sm" />
                          ) : q.rank === 3 ? (
                            <Medal className="h-5 w-5 text-amber-700 drop-shadow-sm" />
                          ) : (
                            `#${q.rank}`
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-zinc-900 sm:text-base">
                            {q.who}
                          </h3>
                          <p className="mt-0.5 truncate text-[11px] text-zinc-500 sm:text-xs">
                            {q.vendorEmail}
                          </p>
                        </div>
                      </div>
                      {isWinner && (
                        <span className="bg-brand-blue flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm">
                          <Trophy className="h-3 w-3" />
                          Winner
                        </span>
                      )}
                    </div>

                    <div className="mt-auto space-y-3 border-t border-zinc-100 pt-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                            Quoted Price
                          </span>
                          <span className="text-xl leading-none font-black tracking-tight text-zinc-900 tabular-nums sm:text-2xl">
                            {q.newPrice}{" "}
                            <span className="text-xs font-bold text-zinc-500 sm:text-sm">
                              {req.currency}
                            </span>
                          </span>
                        </div>

                        {!req.awardedQuoteId && (
                          <div className="shrink-0">
                            <AwardButton
                              requirementId={req.id}
                              quoteId={q.id}
                              vendorLabel={q.vendorEmail}
                              price={q.newPrice}
                              currency={req.currency}
                              project={req.project}
                              closesAt={req.closesAt}
                            />
                          </div>
                        )}
                      </div>

                      {q.remarks && (
                        <div>
                          <span className="mb-1 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                            Remarks
                          </span>
                          <p className="rounded-lg border border-zinc-100 bg-zinc-50 p-2.5 text-xs leading-relaxed text-zinc-700 italic sm:text-sm">
                            "{q.remarks}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400 sm:text-xs">
                          <Calendar className="h-3 w-3" />
                          {q.submittedAt ? formatDateTime(q.submittedAt.toISOString()) : "—"}
                        </span>

                        {q.quoteFileUrl && (
                          <a
                            href={q.quoteFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:border-brand-blue hover:text-brand-blue focus-visible:ring-brand-blue/20 flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Market Trends Analysis Graph */}
        <div className="flex h-full min-h-[400px] flex-col">
          <div className="mb-4 flex shrink-0 items-center gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-950">
              Market Trends & Analysis
            </h2>
            {/* Live Indicator */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                liveStatus === "live"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {liveStatus === "live" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    liveStatus === "live" ? "bg-emerald-500" : "bg-zinc-400"
                  }`}
                ></span>
              </span>
              {liveStatus === "live" ? "Live" : "Connecting..."}
            </span>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {liveData ? (
              <div className="relative -ml-2 h-full w-full">
                <LiveBiddingGraph data={liveData} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                No live data available
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
