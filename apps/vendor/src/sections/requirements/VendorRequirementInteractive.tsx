"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  FileText,
  Medal,
  Trophy,
} from "lucide-react";
import { useState } from "react";

import { useVendorLiveBidding } from "@/hooks/use-vendor-live-bidding";
import { describeDeadline } from "@/lib/rfq";

import { QuoteForm, type QuoteFormRequirement } from "./QuoteForm";
import { LiveBiddingCockpit } from "./LiveBiddingCockpit";

export type VendorRequirementDetail = QuoteFormRequirement & {
  status: string;
  phase?: string;
  opensAt?: string | null;
  closesAt?: string | null;
  targetPrice?: string | null;
  revealTargetPrice?: boolean;
  isEnded?: boolean;
  endedStatus?: "WON" | "LOST" | "UNDER_EVALUATION" | "CANCELLED" | "EXPIRED" | null;
  isAwardedToMe?: boolean;
  awardedAt?: string | null;
  bidHistory?: { id: string; price: string | null; submittedAt: string; status: string }[];
  previousQuotation?: {
    amount: number;
    currency: string;
    source: string;
    receivedAt: string;
    attachments?: { id: string; fileName: string; downloadPath?: string; fileUrl?: string }[];
  } | null;
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
  const phase = requirement.phase || "";
  const isScheduled = phase === "SCHEDULED";
  const lockedReason = isScheduled
    ? "Bidding has not opened yet. You can review the scope now; submission starts when the window opens."
    : closed
      ? "This bidding window is closed."
      : null;
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
              Closes {requirement.closesAt ? new Date(requirement.closesAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }) : "window not set"}
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
            <p suppressHydrationWarning className="text-2xl font-black tracking-tight text-zinc-950 tabular-nums">
              {myPrice ? (
                <>
                  {Number(myPrice).toLocaleString("en-US")}{" "}
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
                  {requirement.closesAt ? (
                    <>
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" /> Closes{" "}
                      {new Date(requirement.closesAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </>
                  ) : (
                    "Bidding window not set"
                  )}
                </span>
              </div>

              {/* Formatted Scope Content */}
              <div className="rounded-2xl bg-zinc-50/70 p-5 text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">
                {requirement.scopeOfWork || "No detailed scope description provided."}
              </div>
            </div>
          </section>

          {/* Card B: Live cockpit — target, countdown, rank, own history */}
          <section className="overflow-hidden rounded-3xl bg-white p-7 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]">
            <LiveBiddingCockpit data={data} status={status} currency={requirement.currency} />
            {requirement.previousQuotation && (
              <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Your previous quotation</p>
                <p className="mt-1 text-sm font-bold text-zinc-900">
                  {Number(requirement.previousQuotation.amount).toLocaleString("en-US")} {requirement.previousQuotation.currency}
                  <span className="ml-2 text-xs font-medium text-zinc-500">via {requirement.previousQuotation.source}</span>
                </p>
                {(requirement.previousQuotation.attachments || []).map((att) => (
                  <a
                    key={att.id}
                    href={att.downloadPath || att.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-xs font-semibold text-brand-blue underline"
                  >
                    {att.fileName}
                  </a>
                ))}
              </div>
            )}
            {(requirement.bidHistory || []).length > 0 && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-100">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Your bid history</th>
                      <th className="px-3 py-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirement.bidHistory!.map((row) => (
                      <tr key={row.id} className="border-t border-zinc-100">
                        <td className="px-3 py-2 text-zinc-600">{new Date(row.submittedAt).toLocaleString("en-GB")}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                          {row.price ? `${Number(row.price).toLocaleString("en-US")} ${requirement.currency}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                <QuoteForm
                  requirement={requirement}
                  action={action}
                  onSubmitted={refresh}
                  lockedReason={isScheduled ? lockedReason : null}
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-zinc-50 p-5 text-center">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Your Final Submitted Bid
                    </p>
                    <p suppressHydrationWarning className="mt-1.5 text-2xl font-black text-zinc-950 tabular-nums">
                      {myPrice ? `${Number(myPrice).toLocaleString("en-US")} ${requirement.currency}` : "No Quote Submitted"}
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
