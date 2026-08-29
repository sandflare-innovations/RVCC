"use client";

import { Trophy, TrendingDown, Users, AlertCircle, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import type { VendorLiveBidsPayload } from "@rvcc/types";

export function LiveBiddingCockpit({
  data,
  status,
  currency,
}: {
  data: VendorLiveBidsPayload | null;
  status: "connecting" | "live" | "offline";
  currency: string;
}) {
  const totalBidders = data?.totalBidders ?? 0;
  const lowestPrice = data?.lowestPrice ?? null;
  const myRank = data?.myRank ?? null;
  const myPrice = data?.myPrice ?? null;
  const isLeading = data?.isLeading ?? false;
  const leaderboard = data?.leaderboard ?? [];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 text-white px-5 py-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {status === "live" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  status === "live" ? "bg-emerald-400" : "bg-zinc-500"
                }`}
              ></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              {status === "live" ? "Live Bidding Engine" : "Connecting Live Feed..."}
            </span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Users className="h-3.5 w-3.5 text-zinc-400" />
            <span>{totalBidders} Active {totalBidders === 1 ? "Bidder" : "Bidders"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Blind & Anonymized Bidding</span>
        </div>
      </div>

      {/* Hero Rank Status Banner */}
      {myRank !== null ? (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isLeading
              ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 text-emerald-950 shadow-sm"
              : "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-300 text-amber-950 shadow-sm"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black text-xl shadow-sm ${
                  isLeading
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-600 text-white"
                }`}
              >
                #{myRank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold tracking-tight">
                    {isLeading
                      ? "You Have the Lowest Offer (Rank #1)"
                      : `You Are Currently Rank #${myRank}`}
                  </h3>
                  {isLeading && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                      <Trophy className="h-3 w-3" /> Leading
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm opacity-90">
                  {isLeading
                    ? `Your offer of ${myPrice} ${currency} is currently the lowest submitted bid.`
                    : lowestPrice
                      ? `The leading bid is ${lowestPrice} ${currency}. Revise your price below to climb the leaderboard.`
                      : "Submit a competitive revision to improve your ranking."}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
                Your Submitted Price
              </p>
              <p className="text-2xl font-black tabular-nums tracking-tight">
                {myPrice} <span className="text-sm font-semibold">{currency}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-200 text-zinc-600 font-bold text-sm">
              —
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Not in Ranking</p>
              <p className="text-xs text-zinc-500">
                Submit your quotation to claim your position on the live leaderboard.
              </p>
            </div>
          </div>
          {lowestPrice && (
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Current Best Offer
              </p>
              <p className="text-sm font-bold text-zinc-900 tabular-nums">
                {lowestPrice} {currency}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Live Anonymized Leaderboard Feed */}
      {leaderboard.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Live Price Leaderboard
            </h4>
            <span className="text-[11px] font-medium text-zinc-500">
              Auto-updates in real time
            </span>
          </div>

          <div className="divide-y divide-zinc-100">
            {leaderboard.map((item) => (
              <div
                key={`${item.rank}-${item.price}`}
                className={`flex items-center justify-between px-5 py-3 text-sm transition-colors ${
                  item.isYou
                    ? "bg-brand-blue/5 font-semibold text-brand-blue"
                    : "hover:bg-zinc-50/80 text-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.rank === 1
                        ? "bg-emerald-100 text-emerald-800"
                        : item.rank === 2
                          ? "bg-zinc-200 text-zinc-800"
                          : item.rank === 3
                            ? "bg-amber-100 text-amber-800"
                            : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    #{item.rank}
                  </span>
                  <span className="text-xs">
                    {item.maskedName}
                    {item.isYou && (
                      <span className="ml-2 text-[10px] bg-brand-blue text-white px-2 py-0.5 rounded-full font-bold">
                        YOU
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col text-right">
                    <span className="font-bold tabular-nums">
                      {item.price} {item.currency}
                    </span>
                    {item.currency !== "SAR" && item.amountSar && (
                      <span className="text-[10px] text-zinc-500 font-medium tabular-nums">
                        ≈ {item.amountSar} SAR
                      </span>
                    )}
                  </div>
                  {item.rank === 1 && (
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      L1 Offer
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
