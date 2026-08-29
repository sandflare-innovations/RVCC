"use client";

import { useState } from "react";
import { Trophy, FileText, LayoutGrid, List, ArrowUpDown, ChevronDown, Calendar, Calculator, Sigma, Medal } from "lucide-react";
import { AwardButton } from "@/sections/AwardButton";

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

  // Sorting logic
  const sortedQuotes = [...ranked].sort((a, b) => {
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

  // Calculate Metrics
  const totalQuotes = ranked.length;
  const averagePrice = totalQuotes > 0 
    ? (ranked.reduce((acc, q) => acc + Number(q.newPrice), 0) / totalQuotes).toFixed(2)
    : "0.00";

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            Quotes Received
          </h2>
          {draftsCount > 0 && (
            <span className="bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {draftsCount} Drafts
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Custom Sort Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSortOpen((prev) => !prev)}
              onBlur={() => setTimeout(() => setSortOpen(false), 200)}
              className="focus-visible:ring-brand-blue/25 flex items-center justify-between gap-3 rounded-full border border-zinc-200 hover:border-brand-blue bg-white py-2 pl-4 pr-3 text-sm font-medium text-zinc-700 outline-none focus-visible:ring-[3px] transition-all min-w-[180px] shadow-sm"
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-zinc-400" />
                <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </button>
            
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-zinc-200 bg-white py-2 shadow-lg z-50">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSort(o.value);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      o.value === sort ? "bg-zinc-50 font-semibold text-brand-blue" : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 shadow-sm">
            <button
              onClick={() => setView("grid")}
              className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${
                view === "grid" ? "bg-zinc-100 text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${
                view === "table" ? "bg-zinc-100 text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
            <Trophy className="h-8 w-8 text-zinc-300" />
          </div>
          <h3 className="text-base font-bold tracking-tight text-zinc-900">No submitted quotes yet</h3>
          <p className="mt-1.5 text-sm text-zinc-500 max-w-sm mx-auto">
            When vendors submit their quotes, they will appear here.
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sortedQuotes.map((q) => {
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
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Quoted Price</span>
                    <span className="text-2xl font-bold text-zinc-900 tabular-nums tracking-tight leading-none">
                      {q.newPrice} <span className="text-sm font-bold text-zinc-500">{req.currency}</span>
                    </span>
                  </div>
                  
                  {q.remarks && (
                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">Remarks</span>
                      <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-lg border border-zinc-100/80 leading-relaxed">
                        "{q.remarks}"
                      </p>
                    </div>
                  )}
                  
                  {q.quoteFileUrl && (
                    <div>
                      <a 
                        href={q.quoteFileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 shadow-sm"
                      >
                        <FileText className="h-4 w-4" />
                        View Quote PDF
                      </a>
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
      ) : (
        <div className="flex flex-col min-h-0 w-full rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
          {/* Fixed Top Header */}
          <div className="shrink-0 bg-brand-blue text-white rounded-2xl px-6 py-3.5 shadow-xs mb-2">
            <div className="grid grid-cols-12 gap-3 items-center text-xs font-semibold">
              <div className="col-span-1 min-w-0">Rank</div>
              <div className="col-span-4 min-w-0">Vendor</div>
              <div className="col-span-3 min-w-0">Price</div>
              <div className="col-span-2 min-w-0">Submitted Date</div>
              <div className="col-span-2 min-w-0 text-right">Actions</div>
            </div>
          </div>

          {/* Scrollable Rows */}
          <div data-lenis-prevent className="min-h-0 overflow-y-auto max-h-[500px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-2 pr-1">
            {sortedQuotes.map((q) => {
              const isWinner = req.awardedQuoteId === q.id;
              return (
                <div
                  key={q.id}
                  className={`grid grid-cols-12 gap-3 items-center bg-white ring-1 ring-inset rounded-2xl p-4 transition-all hover:ring-brand-blue/40 hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)] text-sm ${isWinner ? 'ring-brand-blue/40 bg-brand-blue/[0.04]' : 'ring-zinc-100'}`}
                >
                  <div className="col-span-1 min-w-0">
                    <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isWinner ? 'bg-brand-blue text-white' : 'bg-brand-blue/10 text-brand-blue'}`}>
                      {q.rank === 1 ? (
                        <Medal className="h-4 w-4 text-yellow-500 drop-shadow-sm" />
                      ) : q.rank === 2 ? (
                        <Medal className="h-4 w-4 text-slate-400 drop-shadow-sm" />
                      ) : q.rank === 3 ? (
                        <Medal className="h-4 w-4 text-amber-700 drop-shadow-sm" />
                      ) : (
                        `#${q.rank}`
                      )}
                    </div>
                  </div>
                  <div className="col-span-4 min-w-0">
                    <div className="font-semibold text-zinc-900 flex items-center gap-2 truncate">
                      <span className="truncate">{q.who}</span>
                      {isWinner && (
                        <span className="flex items-center gap-1 bg-brand-blue text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0">
                          <Trophy className="h-2.5 w-2.5" />
                          Winner
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">{q.vendorEmail}</div>
                  </div>
                  <div className="col-span-3 min-w-0 truncate">
                    <span className="font-bold text-zinc-900 tabular-nums">{q.newPrice}</span>
                    <span className="text-xs font-semibold text-zinc-500 ml-1">{req.currency}</span>
                  </div>
                  <div className="col-span-2 min-w-0 text-zinc-500 text-xs truncate">
                    {q.submittedAt ? formatDateTime(q.submittedAt.toISOString()) : "—"}
                  </div>
                  <div className="col-span-2 min-w-0 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {q.quoteFileUrl && (
                        <a 
                          href={q.quoteFileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View PDF
                        </a>
                      )}
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
        </div>
      )}
    </section>
  );
}
