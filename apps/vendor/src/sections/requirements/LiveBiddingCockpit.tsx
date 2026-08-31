"use client";

import type { VendorLiveBidsPayload } from "@rvcc/types";
import {
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-900 px-5 py-3.5 text-white shadow-sm">
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
            <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase">
              {status === "live" ? "Live Bidding Engine" : "Connecting Live Feed..."}
            </span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Users className="h-3.5 w-3.5 text-zinc-400" />
            <span>
              {totalBidders} Active {totalBidders === 1 ? "Bidder" : "Bidders"}
            </span>
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
          className={`rounded-2xl border p-5 transition-all ${
            isLeading
              ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-950 shadow-sm"
              : "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-950 shadow-sm"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black shadow-sm ${
                  isLeading ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
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

            <div className="w-full border-t pt-3 text-left sm:w-auto sm:border-t-0 sm:pt-0 sm:text-right">
              <p className="text-[11px] font-semibold tracking-wider uppercase opacity-75">
                Your Submitted Price
              </p>
              <p className="text-2xl font-black tracking-tight tabular-nums">
                {myPrice} <span className="text-sm font-semibold">{currency}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-200 text-sm font-bold text-zinc-600">
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
              <p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
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
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-3.5">
            <h4 className="text-xs font-bold tracking-wider text-zinc-700 uppercase">
              Live Price Leaderboard
            </h4>
            <span className="text-[11px] font-medium text-zinc-500">Auto-updates in real time</span>
          </div>

          <div className="divide-y divide-zinc-100">
            {leaderboard.map((item) => (
              <div
                key={`${item.rank}-${item.price}`}
                className={`flex items-center justify-between px-5 py-3 text-sm transition-colors ${
                  item.isYou
                    ? "bg-brand-blue/5 text-brand-blue font-semibold"
                    : "text-zinc-800 hover:bg-zinc-50/80"
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
                      <span className="bg-brand-blue ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
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
                      <span className="text-[10px] font-medium text-zinc-500 tabular-nums">
                        ≈ {item.amountSar} SAR
                      </span>
                    )}
                  </div>
                  {item.rank === 1 && (
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
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
