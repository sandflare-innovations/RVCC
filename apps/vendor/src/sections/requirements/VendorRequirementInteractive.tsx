"use client";

import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

import { useVendorLiveBidding } from "@/hooks/use-vendor-live-bidding";
import { describeDeadline } from "@/lib/rfq";

import { QuoteForm, type QuoteFormRequirement } from "./QuoteForm";

export type VendorRequirementDetail = QuoteFormRequirement & {
  status: string;
  isEnded?: boolean;
  endedStatus?: "WON" | "LOST" | "UNDER_EVALUATION" | "CANCELLED" | "EXPIRED" | null;
  isAwardedToMe?: boolean;
  awardedAt?: string | null;
};

export function VendorRequirementInteractive({
  requirement,
  action,
  closed,
}: {
  requirement: VendorRequirementDetail;
  action: string;
  closed: boolean;
}) {
  const { data, status, refresh } = useVendorLiveBidding(requirement.id);
  const [copied, setCopied] = useState(false);

  const deadline = describeDeadline(requirement.closesAt);
  const totalBidders = data?.totalBidders ?? 0;
  const lowestPrice = data?.lowestPrice ?? null;
  const myRank = data?.myRank ?? null;
  const myPrice = data?.myPrice ?? requirement.newPrice ?? null;
  const isLeading = data?.isLeading ?? false;
  const leaderboard = data?.leaderboard ?? [];

  const handleCopyScope = () => {
    if (requirement.scopeOfWork) {
      navigator.clipboard.writeText(requirement.scopeOfWork);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP METRICS KPI GRID (4 Grid Cards)                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Metric 1: Sourcing Deadline */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
              Deadline
            </span>
            <div className={`rounded-lg p-2 ${deadline.urgent ? "bg-red-50 text-red-600" : "bg-blue-50 text-brand-blue"}`}>
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl font-black tracking-tight text-zinc-950 tabular-nums sm:text-2xl">
              {closed ? "Closed" : deadline.label}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {new Date(requirement.closesAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Metric 2: Live Market Standing */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
              Your Position
            </span>
            <div className={`rounded-lg p-2 ${
              myRank === 1
                ? "bg-amber-50 text-amber-600"
                : myRank
                  ? "bg-blue-50 text-brand-blue"
                  : "bg-zinc-100 text-zinc-500"
            }`}>
              <Medal className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <p className="text-xl font-black tracking-tight text-zinc-950 tabular-nums sm:text-2xl">
                {myRank !== null ? `Rank #${myRank}` : "Not Ranked"}
              </p>
              {isLeading && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  <Trophy className="h-2.5 w-2.5" /> L1
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {myRank === 1
                ? "Lowest commercial offer"
                : myRank
                  ? "Competitive in market"
                  : "Submit quote to rank"}
            </p>
          </div>
        </div>

        {/* Metric 3: Best Market Offer (L1) */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
              Leading Market Offer
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl font-black tracking-tight text-zinc-950 tabular-nums sm:text-2xl">
              {lowestPrice ? (
                <>
                  {Number(lowestPrice).toLocaleString()}{" "}
                  <span className="text-xs font-bold text-zinc-500">{requirement.currency}</span>
                </>
              ) : (
                <span className="text-zinc-400 font-normal text-base">Awaiting Bids</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {totalBidders} Active {totalBidders === 1 ? "Bidder" : "Bidders"}
            </p>
          </div>
        </div>

        {/* Metric 4: Your Submitted Offer */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
              Your Current Bid
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-brand-blue">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl font-black tracking-tight text-zinc-950 tabular-nums sm:text-2xl">
              {myPrice ? (
                <>
                  {Number(myPrice).toLocaleString()}{" "}
                  <span className="text-xs font-bold text-zinc-500">{requirement.currency}</span>
                </>
              ) : (
                <span className="text-zinc-400 font-normal text-base">No Bid Yet</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {requirement.quoteStatus === "SUBMITTED"
                ? "Officially Submitted"
                : requirement.quoteStatus === "DRAFT"
                  ? "Saved Draft"
                  : "Unquoted"}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE RESPONSIVE GRID (7 Cols Left / 5 Cols Right)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN (7 Cols): Project Scope & Competitive Live Leaderboard      */}
        {/* ----------------------------------------------------------------------- */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card A: Scope of Work & Requirement Brief */}
          <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/60 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-brand-blue">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-950">Scope of Work & Specifications</h2>
                  <p className="text-[11px] text-zinc-500">Review deliverables and technical specs</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyScope}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 shadow-2xs hover:bg-zinc-50 hover:text-zinc-900"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <span>Copy text</span>
                )}
              </button>
            </div>

            <div className="p-6">
              {/* Metadata Pill Tags */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {requirement.referenceNumber && (
                  <span className="font-mono inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                    Ref: {requirement.referenceNumber}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-brand-blue">
                  Base Currency: {requirement.currency}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> Blind RFQ Sourcing
                </span>
              </div>

              {/* Formatted Scope Content */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4.5 text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">
                {requirement.scopeOfWork || "No detailed scope description provided."}
              </div>
            </div>
          </section>

          {/* Card B: Live Real-Time Leaderboard & Market Feed */}
          <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {status === "live" && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                        status === "live" ? "bg-emerald-400" : "bg-zinc-500"
                      }`}
                    ></span>
                  </span>
                  <h2 className="text-sm font-bold tracking-wider uppercase">
                    Live Leaderboard Feed
                  </h2>
                </div>
                <span className="text-zinc-600">|</span>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Users className="h-3.5 w-3.5" />
                  <span>{totalBidders} Total Bidders</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refresh}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Refresh Leaderboard"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Anonymized</span>
                </div>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-zinc-400">
                <Users className="mb-2 h-7 w-7 text-zinc-300" />
                <p className="font-semibold text-zinc-600">No active competitive quotes yet</p>
                <p className="mt-0.5 text-zinc-400">Be the first vendor to submit your quotation!</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {leaderboard.map((item) => (
                  <div
                    key={`${item.rank}-${item.price}`}
                    className={`flex items-center justify-between px-6 py-3.5 text-sm transition-colors ${
                      item.isYou
                        ? "bg-brand-blue/5 font-semibold text-brand-blue"
                        : "text-zinc-800 hover:bg-zinc-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-2xs ${
                          item.rank === 1
                            ? "bg-amber-400 text-amber-950 border border-amber-300"
                            : item.rank === 2
                              ? "bg-slate-200 text-slate-900 border border-slate-300"
                              : item.rank === 3
                                ? "bg-amber-600 text-white"
                                : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {item.rank === 1 ? "1" : `#${item.rank}`}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-zinc-900">
                          {item.maskedName}
                        </span>
                        {item.isYou && (
                          <span className="bg-brand-blue ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col text-right">
                        <span className="font-bold tabular-nums text-zinc-950">
                          {Number(item.price).toLocaleString()} {item.currency}
                        </span>
                        {item.currency !== "SAR" && item.amountSar && (
                          <span className="text-[10px] font-medium text-zinc-400 tabular-nums">
                            ≈ {Number(item.amountSar).toLocaleString()} SAR
                          </span>
                        )}
                      </div>
                      {item.rank === 1 && (
                        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase">
                          L1 Leader
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN (5 Cols): Bid Submission Console & Compliance Guidance     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-6">
          {/* Card C: Quotation & Commercial Submission Terminal */}
          <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm">
            <div className="border-b border-zinc-100 bg-zinc-50/60 px-6 py-4">
              <h2 className="text-base font-bold tracking-tight text-zinc-950">
                {closed
                  ? "Quotation Summary"
                  : data?.myStatus === "SUBMITTED"
                    ? "Manage & Revise Your Bid"
                    : "Submit Commercial Offer"}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {closed
                  ? "Sourcing has concluded for this requirement"
                  : "Lowest normalized offer takes the leading rank"}
              </p>
            </div>

            <div className="p-6">
              {!closed ? (
                <QuoteForm requirement={requirement} action={action} onSubmitted={refresh} />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Your Final Submitted Bid
                    </p>
                    <p className="mt-1 text-2xl font-black text-zinc-950 tabular-nums">
                      {myPrice ? `${Number(myPrice).toLocaleString()} ${requirement.currency}` : "No Quote Submitted"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Card D: Bidding Transparency & Rules Guidance */}
          <section className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-blue-50/50 via-white to-zinc-50 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-brand-blue" />
              <h3 className="text-xs font-bold tracking-wider text-zinc-800 uppercase">
                Procurement Guidelines
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue"></span>
                <span>
                  <strong>Blind Evaluation:</strong> Competitor company names are fully anonymized.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue"></span>
                <span>
                  <strong>Free Revisions:</strong> You may submit lower price revisions anytime before the countdown expires.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue"></span>
                <span>
                  <strong>Multi-Currency Normalization:</strong> Foreign currency bids are converted to SAR using live FX rates for fair ranking.
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
