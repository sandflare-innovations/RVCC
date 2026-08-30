"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  Target, 
  ShieldCheck, 
  TrendingDown, 
  Clock, 
  Users, 
  Trophy, 
  Medal, 
  FileText, 
  ArrowUpDown, 
  ChevronDown,
  Calendar,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { useAdminLiveBidding } from "@/hooks/use-admin-live-bidding";
import { LiveBiddingGraph } from "./LiveBiddingGraph";
import { AwardButton } from "./AwardButton";
import type { AdminLiveBidsPayload } from "@rvcc/types";

interface LiveMarketDetailViewProps {
  initialPayload: {
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
      vendorUser?: { email: string; name: string | null };
      participantEmail?: string;
      participantName?: string | null;
    }>;
  };
}

function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function LiveMarketDetailView({ initialPayload }: LiveMarketDetailViewProps) {
  const req = initialPayload?.requirement;
  const initialQuotes = initialPayload?.quotes ?? [];

  // Pre-calculate initial data from server payload so the page renders instantly without blank screen
  const initialLiveData: AdminLiveBidsPayload = useMemo(() => {
    if (!req) {
      return {
        requirementId: "",
        project: "Requirement",
        currency: "SAR",
        status: "OPEN",
        sellingPrice: null,
        closesAt: new Date().toISOString(),
        awardedQuoteId: null,
        totalQuotes: 0,
        lowestPrice: null,
        averagePrice: null,
        quotes: [],
        updatedAt: new Date().toISOString(),
      };
    }

    const submitted = (initialQuotes || []).filter((q) => q && q.status === "SUBMITTED");
    const prices = submitted.map((q) => Number(q.newPrice)).filter((p) => !isNaN(p) && p > 0);
    const lowest = prices.length > 0 ? String(Math.min(...prices)) : null;

    return {
      requirementId: req.id,
      project: req.project || "Requirement",
      currency: req.currency || "SAR",
      status: req.status || "OPEN",
      sellingPrice: req.sellingPrice ? String(req.sellingPrice) : null,
      closesAt: req.closesAt || new Date().toISOString(),
      awardedQuoteId: req.awardedQuoteId || null,
      totalQuotes: submitted.length,
      lowestPrice: lowest,
      averagePrice: null,
      quotes: submitted.map((q, idx) => {
        const email = q.vendorUser?.email || q.participantEmail || "vendor@example.com";
        const name = q.vendorUser?.name || q.participantName || email;
        const p = Number(q.newPrice) || 0;
        const l1P = (lowest && !isNaN(Number(lowest))) ? Number(lowest) : p;
        const variance = (l1P > 0) ? ((p - l1P) / l1P) * 100 : 0;

        return {
          id: q.id,
          vendorId: "",
          rank: idx + 1,
          who: name,
          vendorEmail: email,
          newPrice: String(q.newPrice || 0),
          amountSar: null,
          remarks: q.remarks ?? null,
          currency: req.currency || "SAR",
          submittedAt: q.submittedAt || null,
          isLeading: idx === 0,
          varianceFromL1Percent: isNaN(variance) ? 0 : variance,
        };
      }),
      updatedAt: new Date().toISOString(),
    };
  }, [req, initialQuotes]);

  const { data: liveData, status: liveStatus, errorMsg } = useAdminLiveBidding(req?.id || "", initialLiveData);
  const displayData = liveData || initialLiveData;

  const [sort, setSort] = useState<"rank" | "price" | "time">("rank");
  const [sortOpen, setSortOpen] = useState(false);

  const targetPrice = displayData.sellingPrice && !isNaN(Number(displayData.sellingPrice))
    ? Number(displayData.sellingPrice) 
    : req?.sellingPrice && !isNaN(Number(req.sellingPrice)) ? Number(req.sellingPrice) : null;

  const lowestPrice = displayData.lowestPrice && !isNaN(Number(displayData.lowestPrice)) ? Number(displayData.lowestPrice) : null;
  const savings = (targetPrice != null && lowestPrice != null && targetPrice > lowestPrice) ? targetPrice - lowestPrice : null;
  const savingsPct = (savings != null && targetPrice != null && targetPrice > 0) ? (((targetPrice - lowestPrice!) / targetPrice) * 100).toFixed(1) : null;

  // Combine live quote rankings
  const activeQuotes = useMemo(() => {
    if (displayData.quotes && displayData.quotes.length > 0) {
      return displayData.quotes.map((lq) => {
        const matchingInitial = initialQuotes.find((iq) => iq.id === lq.id);
        return {
          id: lq.id,
          rank: lq.rank,
          price: Number(lq.newPrice),
          displayPrice: `${Number(lq.newPrice).toLocaleString()} ${lq.currency}`,
          who: lq.who,
          vendorEmail: lq.vendorEmail,
          currency: lq.currency,
          varianceFromL1Percent: lq.varianceFromL1Percent,
          isLeading: lq.isLeading,
          remarks: matchingInitial?.remarks ?? null,
          quoteFileUrl: matchingInitial?.quoteFileUrl ?? null,
          submittedAt: lq.submittedAt ? new Date(lq.submittedAt) : null,
        };
      });
    }

    return initialQuotes
      .filter((q) => q.status === "SUBMITTED")
      .map((q, idx) => {
        const email = q.vendorUser?.email || q.participantEmail || "vendor@example.com";
        const name = q.vendorUser?.name || q.participantName || email;
        return {
          id: q.id,
          rank: idx + 1,
          price: Number(q.newPrice),
          displayPrice: `${Number(q.newPrice).toLocaleString()} ${req.currency}`,
          who: name,
          vendorEmail: email,
          currency: req.currency,
          varianceFromL1Percent: idx === 0 ? 0 : 5,
          isLeading: idx === 0,
          remarks: q.remarks,
          quoteFileUrl: q.quoteFileUrl,
          submittedAt: q.submittedAt ? new Date(q.submittedAt) : null,
        };
      });
  }, [displayData.quotes, initialQuotes, req.currency]);

  const sortedQuotes = useMemo(() => {
    const arr = [...activeQuotes];
    if (sort === "price") {
      arr.sort((a, b) => a.price - b.price);
    } else if (sort === "time") {
      arr.sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
    } else {
      arr.sort((a, b) => a.rank - b.rank);
    }
    return arr;
  }, [activeQuotes, sort]);

  const isExpired = req?.closesAt && new Date(req.closesAt).getTime() <= Date.now();

  return (
    <div className="flex flex-col min-h-0 w-full h-full">
      {/* Top Fixed Header */}
      <div className="flex-none flex items-center justify-between bg-white border-b border-zinc-200/80 px-6 py-3.5 z-10 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/live-market"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            aria-label="Back to Live Market"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">
                {req?.project || "Requirement"}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Live Market
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5" suppressHydrationWarning>
              Ref: {req?.referenceNumber ?? "—"} • Currency: {req?.currency || "SAR"} • Closes: {formatDateTime(req?.closesAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/requirements/${req?.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:border-brand-blue hover:text-brand-blue"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Requirement RFQ View
          </Link>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-4 md:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="mx-auto w-full max-w-7xl space-y-5">

          {/* TOP SIDE: COMPACT STATUS KPI BOXES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Box 1: Target Budget */}
            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                <Target className="h-3.5 w-3.5 text-zinc-500" />
                <span>Target Budget</span>
              </div>
              <p className="text-lg font-black text-zinc-900 tabular-nums leading-tight">
                {targetPrice ? `${targetPrice.toLocaleString()} ${req.currency}` : "Not Set"}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Admin budget ceiling</p>
            </div>

            {/* Box 2: Lowest Bid (L1) */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Best Bid (L1)</span>
              </div>
              <p className="text-lg font-black text-emerald-700 tabular-nums leading-tight">
                {lowestPrice ? `${lowestPrice.toLocaleString()} ${req.currency}` : "—"}
              </p>
              <p className="text-[10px] text-emerald-600/80 mt-0.5 truncate">
                {sortedQuotes[0]?.who ?? "Awaiting initial bids"}
              </p>
            </div>

            {/* Box 3: Potential Savings */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/30 p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-sky-600" />
                <span>Potential Savings</span>
              </div>
              <p className="text-lg font-black text-sky-700 tabular-nums leading-tight">
                {savings != null && savings > 0 
                  ? `${savings.toLocaleString()} ${req.currency}` 
                  : "—"}
              </p>
              <p className="text-[10px] text-sky-600/80 mt-0.5 truncate">
                {savingsPct ? `${savingsPct}% discount below budget` : "Reverse auction delta"}
              </p>
            </div>

            {/* Box 4: Total Bidders & Closes */}
            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                <Users className="h-3.5 w-3.5 text-zinc-500" />
                <span>Total Bidders</span>
              </div>
              <p className="text-lg font-black text-zinc-900 tabular-nums leading-tight">
                {displayData.totalQuotes} Quotes
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5" suppressHydrationWarning>
                {isExpired ? "Auction closed" : `Closes ${formatDate(req?.closesAt)}`}
              </p>
            </div>
          </div>

          {/* MAIN AREA: Graph on Left, Bidding Price & Ranking Box on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* LEFT / CENTER: Full Live Graph (100% Height) */}
            <div className="lg:col-span-7 flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs min-h-[500px] h-full">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-2.5 flex-none">
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  Live Reverse Auction Curve
                </h2>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Hover dots for details
                </span>
              </div>

              <div className="flex-1 w-full h-full min-h-[400px] relative">
                <LiveBiddingGraph data={displayData} showMetrics={false} />
              </div>
            </div>

            {/* RIGHT SIDE BOX: Bidding Price and Ranking */}
            <div className="lg:col-span-5 flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs min-h-[500px] h-full">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Bidding Prices & Ranking
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time competitive ranking ladder
                  </p>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortOpen((p) => !p)}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-xs hover:border-brand-blue"
                  >
                    <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                    <span>{sort === "price" ? "Price" : sort === "time" ? "Time" : "Rank"}</span>
                    <ChevronDown className="h-3 w-3 text-zinc-400" />
                  </button>

                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-32 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg z-50">
                      <button
                        onClick={() => { setSort("rank"); setSortOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 font-medium"
                      >
                        Rank #1 to N
                      </button>
                      <button
                        onClick={() => { setSort("price"); setSortOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 font-medium"
                      >
                        Lowest Price
                      </button>
                      <button
                        onClick={() => { setSort("time"); setSortOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 font-medium"
                      >
                        Latest Time
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Ranking Rows */}
              {sortedQuotes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-zinc-400">
                  <Trophy className="h-10 w-10 text-zinc-300 mb-2" />
                  <p className="text-sm font-semibold text-zinc-700">No Bids Submitted</p>
                  <p className="text-xs text-zinc-400 mt-1">Vendor quotes will appear in real-time as they are placed.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[460px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {sortedQuotes.map((q) => {
                    const isWinner = req?.awardedQuoteId === q.id;
                    const isL1 = q.rank === 1;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isL1
                            ? "border-emerald-200 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-400/20"
                            : "border-zinc-200 bg-white hover:border-brand-blue/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Rank Badge */}
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                isL1
                                  ? "bg-emerald-500 text-white shadow-xs"
                                  : q.rank === 2
                                  ? "bg-slate-200 text-slate-700"
                                  : q.rank === 3
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {isL1 ? (
                                <Medal className="h-5 w-5 text-yellow-300 drop-shadow-xs" />
                              ) : (
                                `#${q.rank}`
                              )}
                            </div>

                            {/* Vendor Info */}
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-zinc-900 truncate">
                                {q.who}
                              </h4>
                              <p className="text-[11px] text-zinc-400 truncate">
                                {q.vendorEmail}
                              </p>
                            </div>
                          </div>

                          {/* Price Tag */}
                          <div className="text-right shrink-0">
                            <span className="text-base sm:text-lg font-black text-zinc-950 tabular-nums">
                              {q.displayPrice}
                            </span>
                            {q.varianceFromL1Percent != null && q.varianceFromL1Percent > 0 && (
                              <p className="text-[10px] font-bold text-rose-600 tabular-nums">
                                +{q.varianceFromL1Percent.toFixed(1)}% vs L1
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Remarks */}
                        {q.remarks && (
                          <p className="mt-2 text-xs text-zinc-600 bg-zinc-50 p-2 rounded-lg border border-zinc-100 italic">
                            "{q.remarks}"
                          </p>
                        )}

                        {/* Footer / Actions */}
                        <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-3 text-xs">
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium" suppressHydrationWarning>
                            <Calendar className="h-3 w-3" />
                            {formatTime(q.submittedAt)}
                          </span>

                          <div className="flex items-center gap-2">
                            {q.quoteFileUrl && (
                              <a
                                href={q.quoteFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 text-[11px] font-semibold text-zinc-700 hover:border-brand-blue hover:text-brand-blue shadow-xs"
                              >
                                <FileText className="h-3 w-3" />
                                PDF
                              </a>
                            )}

                            {!req.awardedQuoteId && (
                              <AwardButton
                                requirementId={req.id}
                                quoteId={q.id}
                                vendorLabel={q.vendorEmail}
                                price={String(q.price)}
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
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
