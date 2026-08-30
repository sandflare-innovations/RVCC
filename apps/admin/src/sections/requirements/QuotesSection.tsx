"use client";

import { useState } from "react";
import { Trophy, FileText, LayoutGrid, List, ArrowUpDown, ChevronDown, Calendar, Calculator, Sigma, Medal, Radio, AlertCircle } from "lucide-react";
import { AwardButton } from "./AwardButton";
import { useAdminLiveBidding } from "@/hooks/use-admin-live-bidding";
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <div className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Total Quotes</p>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
              <Sigma className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
            <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">{totalQuotes}</p>
          </div>
        </div>
        <div className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Avg. Quoted Price</p>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
              <Calculator className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
            <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
              {averagePrice} <span className="text-sm font-semibold text-zinc-400">{req.currency}</span>
            </p>
          </div>
        </div>
        <div className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Ending Date</p>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
            <p className="text-xl font-bold tracking-tight text-zinc-950">{formatDateTime(req.closesAt)}</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-8 p-6 text-center bg-red-50 rounded-2xl border border-red-200">
          <p className="text-sm text-red-600 font-medium flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Live Market Error: {errorMsg}
          </p>
        </div>
      )}

      {/* Main Container for Side-by-Side View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left Column: Quotes List (Price and Vendor Name) */}
        <div className="flex flex-col h-full max-h-[550px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
                Quotes Received
              </h2>
              {draftsCount > 0 && (
                <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
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
                  className="focus-visible:ring-brand-blue/25 flex items-center justify-between gap-2 rounded-full border border-zinc-200 hover:border-brand-blue bg-white py-1.5 pl-3 pr-2.5 text-xs font-semibold text-zinc-700 outline-none focus-visible:ring-[2px] transition-all min-w-[150px] shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                </button>
                
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg z-50">
                    {SORT_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSort(o.value);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                          o.value === sort ? "bg-zinc-50 font-bold text-brand-blue" : "text-zinc-700 hover:bg-zinc-50 font-medium"
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
            <div className="flex-1 min-h-0 rounded-3xl border-2 border-dashed border-zinc-200 bg-white/50 px-6 py-16 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                <Trophy className="h-8 w-8 text-zinc-300" />
              </div>
              <h3 className="text-base font-bold tracking-tight text-zinc-900">No submitted quotes</h3>
              <p className="mt-1.5 text-sm text-zinc-500 max-w-[250px] mx-auto">
                When vendors submit their quotes, they will appear here.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-3">
              {sortedQuotes.map((q) => {
                const isWinner = req.awardedQuoteId === q.id;
                return (
                  <div
                    key={q.id}
                    className={`flex flex-col p-4 sm:p-5 rounded-2xl border transition-all ${
                      isWinner
                        ? 'border-brand-blue bg-blue-50/20 shadow-sm ring-1 ring-brand-blue/10'
                        : 'border-zinc-200 bg-white hover:border-brand-blue/30 hover:shadow-sm hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isWinner ? 'bg-brand-blue text-white shadow-sm' : 'bg-zinc-100 text-zinc-600'}`}>
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
                          <h3 className="font-bold text-zinc-900 truncate text-sm sm:text-base">{q.who}</h3>
                          <p className="text-[11px] sm:text-xs text-zinc-500 truncate mt-0.5">{q.vendorEmail}</p>
                        </div>
                      </div>
                      {isWinner && (
                        <span className="flex items-center gap-1 bg-brand-blue text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0 shadow-sm">
                          <Trophy className="h-3 w-3" />
                          Winner
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-auto pt-3 border-t border-zinc-100 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quoted Price</span>
                          <span className="text-xl sm:text-2xl font-black text-zinc-900 tabular-nums tracking-tight leading-none">
                            {q.newPrice} <span className="text-xs sm:text-sm font-bold text-zinc-500">{req.currency}</span>
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
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Remarks</span>
                          <p className="text-xs sm:text-sm text-zinc-700 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 leading-relaxed italic">
                            "{q.remarks}"
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {q.submittedAt ? formatDateTime(q.submittedAt.toISOString()) : "—"}
                        </span>
                        
                        {q.quoteFileUrl && (
                          <a 
                            href={q.quoteFileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 shadow-sm"
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
        <div className="flex flex-col h-full min-h-[400px]">
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <h2 className="text-xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
              Market Trends & Analysis
            </h2>
            {/* Live Indicator */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                liveStatus === "live"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-zinc-50 text-zinc-600 border-zinc-200"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {liveStatus === "live" && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    liveStatus === "live" ? "bg-emerald-500" : "bg-zinc-400"
                  }`}
                ></span>
              </span>
              {liveStatus === "live" ? "Live" : "Connecting..."}
            </span>
          </div>

          <div className="flex-1 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm overflow-hidden flex flex-col">
            {liveData ? (
              <div className="h-full w-full relative -ml-2">
                <LiveBiddingGraph data={liveData} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                No live data available
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
}
