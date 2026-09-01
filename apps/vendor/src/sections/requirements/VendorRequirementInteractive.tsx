"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  FileText,
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
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. TOP METRICS KPI GRID (Admin-Style Premium Elevated Cards)              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Sourcing Deadline */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,115,188,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Deadline
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black tracking-tight text-zinc-950 tabular-nums">
              {closed ? "Closed" : deadline.label}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-400">
              Closes {new Date(requirement.closesAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Metric 2: Your Live Rank Standing */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,115,188,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Your Position
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Medal className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black tracking-tight text-zinc-950 tabular-nums">
                {myRank !== null ? `Rank #${myRank}` : "Not Ranked"}
              </p>
              {isLeading && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue px-2.5 py-0.5 text-[10px] font-bold text-white uppercase shadow-xs">
                  <Trophy className="h-2.5 w-2.5" /> L1 Leader
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-medium text-zinc-400">
              {myRank === 1
                ? "Lowest commercial offer in market"
                : myRank
                  ? "Real-time ranking standing"
                  : "Submit a quote to enter ranking"}
            </p>
          </div>
        </div>

        {/* Metric 3: Your Submitted Price */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,115,188,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Your Quoted Price
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black tracking-tight text-zinc-950 tabular-nums">
              {myPrice ? (
                <>
                  {Number(myPrice).toLocaleString()}{" "}
                  <span className="text-xs font-bold text-brand-blue">{requirement.currency}</span>
                </>
              ) : (
                <span className="text-zinc-400 font-medium text-lg">No Bid Yet</span>
              )}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-400">
              Base currency: {requirement.currency}
            </p>
          </div>
        </div>

        {/* Metric 4: Quote Status */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,115,188,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Quote Status
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black tracking-tight text-zinc-950">
              {requirement.quoteStatus === "SUBMITTED"
                ? "Submitted"
                : requirement.quoteStatus === "DRAFT"
                  ? "Draft Saved"
                  : "Unquoted"}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-400">
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
      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN (7 Cols): Project Scope & Real-Time Standing                 */}
        {/* ----------------------------------------------------------------------- */}
        <div className="space-y-7 lg:col-span-7">
          {/* Card A: Scope of Work & Deliverables Brief */}
          <section className="overflow-hidden rounded-3xl bg-white p-7 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-zinc-950">
                    Scope of Work & Deliverables
                  </h2>
                  <p className="text-xs text-zinc-400">Project requirements and technical expectations</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyScope}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-brand-blue/10 hover:text-brand-blue"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-6">
              {/* Metadata Pill Tags in Brand Colors */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {requirement.referenceNumber && (
                  <span className="font-mono inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700">
                    Ref: {requirement.referenceNumber}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-xl bg-brand-blue/10 px-3 py-1.5 text-xs font-bold text-brand-blue">
                  Base Currency: {requirement.currency}
                </span>
                <span
                  suppressHydrationWarning
                  className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600"
                >
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" /> Closes{" "}
                  {new Date(requirement.closesAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Formatted Scope Content */}
              <div className="rounded-2xl bg-zinc-50/70 p-5 text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">
                {requirement.scopeOfWork || "No detailed scope description provided."}
              </div>
            </div>
          </section>

          {/* Card B: Your Real-Time Standing & Bid Performance */}
          <section className="overflow-hidden rounded-3xl bg-white p-7 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <Medal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-zinc-950">
                    Your Real-Time Standing
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-2 w-2">
                      {status === "live" && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex h-2 w-2 rounded-full ${
                          status === "live" ? "bg-brand-blue" : "bg-zinc-400"
                        }`}
                      ></span>
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      {status === "live" ? "Live feed active" : "Connecting…"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={refresh}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:bg-brand-blue/10 hover:text-brand-blue transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="pt-6">
              {myRank === 1 ? (
                <div className="rounded-2xl bg-gradient-to-br from-brand-blue/10 via-brand-blue/5 to-white p-6 shadow-xs">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white font-black text-xl shadow-md">
                      #1
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-zinc-950">
                          You Currently Hold the Lowest Offer
                        </h4>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                          L1 Leader
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
                        Your offer of <strong className="text-zinc-950">{Number(myPrice).toLocaleString()} {requirement.currency}</strong> is currently leading the evaluation. If other vendors submit lower revisions before the deadline, you will receive an alert to adjust your offer.
                      </p>
                    </div>
                  </div>
                </div>
              ) : myRank !== null ? (
                <div className="rounded-2xl bg-zinc-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/15 text-brand-blue font-black text-xl">
                      #{myRank}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-zinc-950">
                        You Are Currently Rank #{myRank}
                      </h4>
                      <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
                        Your submitted offer is <strong className="text-zinc-950">{Number(myPrice).toLocaleString()} {requirement.currency}</strong>. You can submit a lower revised bid at any time before the sourcing closes to improve your position.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-zinc-50 p-6 text-zinc-800">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-200 text-zinc-600 font-bold text-lg">
                      —
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-zinc-950">
                        Submit Your Quotation to Enter the Ranking
                      </h4>
                      <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
                        Use the quotation console on the right to enter your commercial price and attach supporting documents. Your rank position is calculated automatically upon submission.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN (5 Cols): Quotation Submission Console (Sticky)            */}
        {/* ----------------------------------------------------------------------- */}
        <div className="space-y-7 lg:col-span-5 lg:sticky lg:top-6">
          {/* Commercial Bid Submission Card */}
          <section className="overflow-hidden rounded-3xl bg-white p-7 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]">
            <div className="pb-5 border-b border-zinc-100">
              <h2 className="text-base font-bold tracking-tight text-zinc-950">
                {closed
                  ? "Quotation Summary"
                  : requirement.quoteStatus === "SUBMITTED"
                    ? "Manage & Revise Your Bid"
                    : "Submit Commercial Offer"}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                {closed
                  ? "Sourcing has concluded for this requirement"
                  : "Enter your price and attach technical proposals"}
              </p>
            </div>

            <div className="pt-6">
              {!closed ? (
                <QuoteForm requirement={requirement} action={action} onSubmitted={refresh} />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-zinc-50 p-5 text-center">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Your Final Submitted Bid
                    </p>
                    <p className="mt-1.5 text-2xl font-black text-zinc-950 tabular-nums">
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
