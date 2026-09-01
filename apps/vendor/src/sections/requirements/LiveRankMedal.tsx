"use client";

import { Award, ShieldAlert, Sparkles, Trophy } from "lucide-react";

import { useVendorLiveBidding } from "@/hooks/use-vendor-live-bidding";

export function LiveRankMedal({
  requirementId,
  fallbackRank,
}: {
  requirementId: string;
  fallbackRank?: number | null;
}) {
  const { data, status } = useVendorLiveBidding(requirementId);

  const rank = status === "live" && data ? data.myRank : fallbackRank ?? null;

  if (status !== "live" && rank == null) {
    return (
      <div className="relative flex h-[78px] w-[78px] flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/90 shadow-md backdrop-blur-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100/80 text-zinc-400">
          <Trophy className="h-6 w-6 animate-pulse opacity-50" />
        </div>
        <span className="mt-1 text-[9px] font-black tracking-widest text-zinc-500 uppercase">
          LIVE
        </span>
      </div>
    );
  }

  // 1st Place - Gold Medal
  if (rank === 1) {
    return (
      <div className="group relative flex h-[78px] w-[78px] flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-amber-200/60 bg-gradient-to-b from-amber-50 via-white to-amber-100/80 shadow-[0_4px_12px_rgba(245,158,11,0.25)] transition-transform group-hover:scale-105">
        {/* Ribbon Decor */}
        <div className="absolute -top-1.5 flex gap-1">
          <div className="h-2.5 w-2 rounded-t-xs bg-red-600 shadow-xs"></div>
          <div className="h-2.5 w-2 rounded-t-xs bg-blue-600 shadow-xs"></div>
        </div>

        {/* Circular Gold Coin */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-400 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_2px_4px_rgba(180,83,9,0.3)]">
          {/* Inner ring */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/70 bg-gradient-to-tr from-amber-500 to-yellow-300">
            <span className="text-xl font-black text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
              1
            </span>
          </div>
          {/* Sparkle badge */}
          <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-100 drop-shadow-sm animate-pulse" />
        </div>

        <span className="mt-1 text-[9px] font-black tracking-wider text-amber-800 uppercase">
          1st Rank
        </span>
      </div>
    );
  }

  // 2nd Place - Silver Medal
  if (rank === 2) {
    return (
      <div className="group relative flex h-[78px] w-[78px] flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_4px_12px_rgba(148,163,184,0.25)] transition-transform group-hover:scale-105">
        {/* Ribbon Decor */}
        <div className="absolute -top-1.5 flex gap-1">
          <div className="h-2.5 w-2 rounded-t-xs bg-blue-600 shadow-xs"></div>
          <div className="h-2.5 w-2 rounded-t-xs bg-red-600 shadow-xs"></div>
        </div>

        {/* Circular Silver Coin */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-300 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_2px_4px_rgba(71,85,105,0.3)]">
          {/* Inner ring */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-gradient-to-tr from-slate-400 to-slate-200">
            <span className="text-xl font-black text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
              2
            </span>
          </div>
        </div>

        <span className="mt-1 text-[9px] font-black tracking-wider text-slate-700 uppercase">
          2nd Rank
        </span>
      </div>
    );
  }

  // 3rd Place - Bronze Medal
  if (rank === 3) {
    return (
      <div className="group relative flex h-[78px] w-[78px] flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-orange-200/80 bg-gradient-to-b from-orange-50 via-white to-amber-100 shadow-[0_4px_12px_rgba(194,65,12,0.2)] transition-transform group-hover:scale-105">
        {/* Ribbon Decor */}
        <div className="absolute -top-1.5 flex gap-1">
          <div className="h-2.5 w-2 rounded-t-xs bg-emerald-600 shadow-xs"></div>
          <div className="h-2.5 w-2 rounded-t-xs bg-orange-600 shadow-xs"></div>
        </div>

        {/* Circular Bronze Coin */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-600 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_2px_4px_rgba(120,53,15,0.3)]">
          {/* Inner ring */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/60 bg-gradient-to-tr from-amber-700 to-amber-400">
            <span className="text-xl font-black text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
              3
            </span>
          </div>
        </div>

        <span className="mt-1 text-[9px] font-black tracking-wider text-amber-900 uppercase">
          3rd Rank
        </span>
      </div>
    );
  }

  // 4th Place or higher
  if (rank != null && rank > 3) {
    return (
      <div className="group relative flex h-[78px] w-[78px] flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-blue-200/80 bg-gradient-to-b from-blue-50 via-white to-blue-100 shadow-sm transition-transform group-hover:scale-105">
        {/* Circular Medal Badge */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-400 bg-gradient-to-br from-blue-400 to-indigo-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_2px_4px_rgba(30,58,138,0.25)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-200/60 bg-blue-600/80 text-white">
            <span className="text-base font-black tracking-tight">#{rank}</span>
          </div>
        </div>

        <span className="mt-1 text-[9px] font-black tracking-wider text-blue-900 uppercase">
          Rank #{rank}
        </span>
      </div>
    );
  }

  // Not Ranked Yet / Draft
  return (
    <div className="relative flex h-[78px] w-[78px] flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/90 shadow-sm backdrop-blur-xs">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-400">
        <Award className="h-5 w-5" />
      </div>
      <span className="mt-1 text-[9px] font-bold tracking-wider text-zinc-500 uppercase">
        Bid Open
      </span>
    </div>
  );
}
