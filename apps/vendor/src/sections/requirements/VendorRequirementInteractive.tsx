"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Layers,
  Medal,
  RefreshCw,
  Sparkles,
  Trophy,
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
  const myRank = status === "live" && data ? data.myRank : null;
  const myPrice = data?.myPrice ?? requirement.newPrice ?? null;
  const isLeading = status === "live" && data ? data.isLeading : false;

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
      {/* 1. TOP METRICS KPI GRID (Vendor-Focused 4-Card Grid)                     */}
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

        {/* Metric 2: Your Live Rank Standing */}
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
                  ? "Rank based on price"
                  : "Submit quote to enter ranking"}
            </p>
          </div>
        </div>

        {/* Metric 3: Your Submitted Offer Price */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
              Your Quoted Price
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
              Base currency: {requirement.currency}
            </p>
          </div>
        </div>

        {/* Metric 4: Quote Status */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
              Quote Status
            </span>
            <div className={`rounded-lg p-2 ${
              requirement.quoteStatus === "SUBMITTED"
                ? "bg-emerald-50 text-emerald-600"
                : requirement.quoteStatus === "DRAFT"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-zinc-100 text-zinc-500"
            }`}>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl font-black tracking-tight text-zinc-950 tabular-nums sm:text-2xl">
              {requirement.quoteStatus === "SUBMITTED"
                ? "Submitted"
                : requirement.quoteStatus === "DRAFT"
                  ? "Draft Saved"
                  : "Unquoted"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {requirement.quoteStatus === "SUBMITTED"
                ? "Active in competition"
                : requirement.quoteStatus === "DRAFT"
                  ? "Ready to submit"
                  : "Pending submission"}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE RESPONSIVE GRID (7 Cols Left / 5 Cols Right)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN (7 Cols): Project Scope & Your Live Commercial Standing     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card A: Scope of Work & Deliverables Brief */}
          <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/60 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-brand-blue">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-950">Scope of Work & Deliverables</h2>
                  <p className="text-[11px] text-zinc-500">Project requirements and technical expectations</p>
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
                  Currency: {requirement.currency}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                  <Calendar className="h-3 w-3" /> Closes {new Date(requirement.closesAt).toLocaleDateString()}
                </span>
              </div>

              {/* Formatted Scope Content */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4.5 text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">
                {requirement.scopeOfWork || "No detailed scope description provided."}
              </div>
            </div>
          </section>

          {/* Card B: Your Real-Time Standing & Bid Status */}
          <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {status === "live" && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      status === "live" ? "bg-emerald-400" : "bg-zinc-400"
                    }`}
                  ></span>
                </span>
                <h3 className="text-xs font-bold tracking-wider text-zinc-700 uppercase">
                  Your Bidding Standing
                </h3>
              </div>

              <button
                type="button"
                onClick={refresh}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {myRank === 1 ? (
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/50 p-5 text-amber-950 shadow-2xs">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 font-black text-xl shadow-xs border border-amber-300">
                    🥇
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-amber-950">
                        You Currently Hold the Lowest Offer (Rank #1)
                      </h4>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-amber-950 uppercase">
                        Leading
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-amber-900/90 leading-relaxed">
                      Your offer of <span className="font-bold">{Number(myPrice).toLocaleString()} {requirement.currency}</span> is currently leading the evaluation. If other vendors submit lower bids before the deadline, you will receive an instant notification to revise your offer.
                    </p>
                  </div>
                </div>
              </div>
            ) : myRank !== null ? (
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-blue-100/50 p-5 text-blue-950 shadow-2xs">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-xs">
                    #{myRank}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-blue-950">
                      You Are Currently Rank #{myRank}
                    </h4>
                    <p className="mt-1 text-xs text-blue-900/90 leading-relaxed">
                      Your submitted offer is <span className="font-bold">{Number(myPrice).toLocaleString()} {requirement.currency}</span>. You can submit a lower revised bid at any time before the sourcing closes to improve your ranking.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 text-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-200 text-zinc-600 font-bold text-lg">
                    —
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-900">
                      Submit Your Quotation to Enter the Ranking
                    </h4>
                    <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                      Use the submission terminal on the right to provide your commercial price and attach supporting proposals. Your position will be calculated in real time upon submission.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN (5 Cols): Bid Submission Terminal                           */}
        {/* ----------------------------------------------------------------------- */}
        <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-6">
          {/* Commercial Bid Submission Terminal Card */}
          <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm">
            <div className="border-b border-zinc-100 bg-zinc-50/60 px-6 py-4">
              <h2 className="text-base font-bold tracking-tight text-zinc-950">
                {closed
                  ? "Quotation Summary"
                  : requirement.quoteStatus === "SUBMITTED"
                    ? "Manage & Revise Your Bid"
                    : "Submit Commercial Offer"}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {closed
                  ? "Sourcing has concluded for this requirement"
                  : "All proposals are evaluated confidentially"}
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
        </div>
      </div>
    </div>
  );
}
