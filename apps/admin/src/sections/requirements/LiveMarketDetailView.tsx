"use client";

import type { AdminLiveBidsPayload } from "@rvcc/types";
import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  FileText,
  Medal,
  ShieldCheck,
  Target,
  TrendingDown,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useAdminLiveBidding } from "@/hooks/use-admin-live-bidding";

import { AwardButton } from "./AwardButton";
import { LiveBiddingGraph } from "./LiveBiddingGraph";

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
        const l1P = lowest && !isNaN(Number(lowest)) ? Number(lowest) : p;
        const variance = l1P > 0 ? ((p - l1P) / l1P) * 100 : 0;

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

  const {
    data: liveData,
    status: liveStatus,
    errorMsg,
  } = useAdminLiveBidding(req?.id || "", initialLiveData);
  const displayData = liveData || initialLiveData;

  const [sort, setSort] = useState<"rank" | "price" | "time">("rank");
  const [sortOpen, setSortOpen] = useState(false);

  const targetPrice =
    displayData.sellingPrice && !isNaN(Number(displayData.sellingPrice))
      ? Number(displayData.sellingPrice)
      : req?.sellingPrice && !isNaN(Number(req.sellingPrice))
        ? Number(req.sellingPrice)
        : null;

  const lowestPrice =
    displayData.lowestPrice && !isNaN(Number(displayData.lowestPrice))
      ? Number(displayData.lowestPrice)
      : null;
  const savings =
    targetPrice != null && lowestPrice != null && targetPrice > lowestPrice
      ? targetPrice - lowestPrice
      : null;
  const savingsPct =
    savings != null && targetPrice != null && targetPrice > 0
      ? (((targetPrice - lowestPrice!) / targetPrice) * 100).toFixed(1)
      : null;

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
          attachments: (matchingInitial as any)?.attachments ?? (lq as any).attachments ?? [],
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
          attachments: (q as any).attachments ?? [],
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
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Top Fixed Header */}
      <div className="z-10 flex flex-none items-center justify-between border-b border-zinc-200/80 bg-white px-6 py-3.5 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/live-market"
            className="focus-visible:ring-brand-blue flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Back to Live Market"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">
                {req?.project || "Requirement"}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                </span>
                Live Market
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500" suppressHydrationWarning>
              Ref: {req?.referenceNumber ?? "—"} • Currency: {req?.currency || "SAR"} • Closes:{" "}
              {formatDateTime(req?.closesAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/requirements/${req?.id}`}
            className="hover:border-brand-blue hover:text-brand-blue inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Requirement RFQ View
          </Link>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 [scrollbar-width:none] overflow-y-auto bg-zinc-50/50 p-4 [-ms-overflow-style:none] md:p-6 [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto w-full max-w-7xl space-y-5">
          {/* TOP SIDE: COMPACT STATUS KPI BOXES */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {/* Box 1: Target Budget */}
            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                <Target className="h-3.5 w-3.5 text-zinc-500" />
                <span>Target Budget</span>
              </div>
              <p className="text-lg leading-tight font-black text-zinc-900 tabular-nums">
                {targetPrice ? `${targetPrice.toLocaleString()} ${req.currency}` : "Not Set"}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-400">Admin budget ceiling</p>
            </div>

            {/* Box 2: Lowest Bid (L1) */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5 shadow-2xs">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Best Bid (L1)</span>
              </div>
              <p className="text-lg leading-tight font-black text-emerald-700 tabular-nums">
                {lowestPrice ? `${lowestPrice.toLocaleString()} ${req.currency}` : "—"}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-emerald-600/80">
                {sortedQuotes[0]?.who ?? "Awaiting initial bids"}
              </p>
            </div>

            {/* Box 3: Potential Savings */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/30 p-3.5 shadow-2xs">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-sky-700 uppercase">
                <TrendingDown className="h-3.5 w-3.5 text-sky-600" />
                <span>Potential Savings</span>
              </div>
              <p className="text-lg leading-tight font-black text-sky-700 tabular-nums">
                {savings != null && savings > 0
                  ? `${savings.toLocaleString()} ${req.currency}`
                  : "—"}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-sky-600/80">
                {savingsPct ? `${savingsPct}% discount below budget` : "Reverse auction delta"}
              </p>
            </div>

            {/* Box 4: Total Bidders & Closes */}
            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                <Users className="h-3.5 w-3.5 text-zinc-500" />
                <span>Total Bidders</span>
              </div>
              <p className="text-lg leading-tight font-black text-zinc-900 tabular-nums">
                {displayData.totalQuotes} Quotes
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-400" suppressHydrationWarning>
                {isExpired ? "Auction closed" : `Closes ${formatDate(req?.closesAt)}`}
              </p>
            </div>
          </div>

          {/* MAIN AREA: Graph on Left, Bidding Price & Ranking Box on Right */}
          <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
            {/* LEFT / CENTER: Full Live Graph (100% Height) */}
            <div className="flex h-full min-h-[500px] flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-7">
              <div className="mb-3 flex flex-none items-center justify-between border-b border-zinc-100 pb-2.5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                  Live Reverse Auction Curve
                </h2>
                <span className="text-[11px] font-medium text-zinc-400">
                  Hover dots for details
                </span>
              </div>

              <div className="relative h-full min-h-[400px] w-full flex-1">
                <LiveBiddingGraph data={displayData} showMetrics={false} />
              </div>
            </div>

            {/* RIGHT SIDE BOX: Bidding Price and Ranking */}
            <div className="flex h-full min-h-[500px] flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-5">
              <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Bidding Prices & Ranking</h2>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Real-time competitive ranking ladder
                  </p>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortOpen((p) => !p)}
                    className="hover:border-brand-blue flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-xs"
                  >
                    <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                    <span>{sort === "price" ? "Price" : sort === "time" ? "Time" : "Rank"}</span>
                    <ChevronDown className="h-3 w-3 text-zinc-400" />
                  </button>

                  {sortOpen && (
                    <div className="absolute top-full right-0 z-50 mt-1.5 w-32 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => {
                          setSort("rank");
                          setSortOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Rank #1 to N
                      </button>
                      <button
                        onClick={() => {
                          setSort("price");
                          setSortOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Lowest Price
                      </button>
                      <button
                        onClick={() => {
                          setSort("time");
                          setSortOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Latest Time
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Ranking Rows */}
              {sortedQuotes.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center text-zinc-400">
                  <Trophy className="mb-2 h-10 w-10 text-zinc-300" />
                  <p className="text-sm font-semibold text-zinc-700">No Bids Submitted</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Vendor quotes will appear in real-time as they are placed.
                  </p>
                </div>
              ) : (
                <div className="max-h-[460px] flex-1 [scrollbar-width:none] space-y-3 overflow-y-auto pr-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {sortedQuotes.map((q) => {
                    const isWinner = req?.awardedQuoteId === q.id;
                    const isL1 = q.rank === 1;

                    return (
                      <div
                        key={q.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          isL1
                            ? "border-emerald-200 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-400/20"
                            : "hover:border-brand-blue/30 border-zinc-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
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
                              <h4 className="truncate text-sm font-bold text-zinc-900">{q.who}</h4>
                              <p className="truncate text-[11px] text-zinc-400">{q.vendorEmail}</p>
                            </div>
                          </div>

                          {/* Price Tag */}
                          <div className="shrink-0 text-right">
                            <span className="text-base font-black text-zinc-950 tabular-nums sm:text-lg">
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
                          <p className="mt-2 rounded-lg border border-zinc-100 bg-zinc-50 p-2 text-xs text-zinc-600 italic">
                            "{q.remarks}"
                          </p>
                        )}

                        {/* Footer / Actions */}
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-2.5 text-xs">
                          <span
                            className="flex items-center gap-1 text-[10px] font-medium text-zinc-400"
                            suppressHydrationWarning
                          >
                            <Calendar className="h-3 w-3" />
                            {formatTime(q.submittedAt)}
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            {(q as any).attachments && (q as any).attachments.length > 0 ? (
                              (q as any).attachments.map((att: any) => (
                                <a
                                  key={att.id}
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:border-brand-blue hover:text-brand-blue inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 shadow-xs"
                                  title={att.fileName}
                                >
                                  <FileText className="h-3 w-3 text-brand-blue" />
                                  <span className="max-w-[100px] truncate">{att.fileName}</span>
                                </a>
                              ))
                            ) : q.quoteFileUrl ? (
                              <a
                                href={q.quoteFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:border-brand-blue hover:text-brand-blue inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-xs"
                              >
                                <FileText className="h-3 w-3" />
                                PDF
                              </a>
                            ) : null}

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
