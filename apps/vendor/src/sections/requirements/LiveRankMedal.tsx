"use client";

import { Award, Sparkles, Trophy } from "lucide-react";

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

  // Unranked / Draft State
  if (rank == null) {
    return (
      <div className="relative flex h-[82px] w-[82px] flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-white/95 p-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur-md">
        {/* Medal Suspension Ribbon */}
        <div className="flex h-2.5 w-6 items-center justify-center rounded-t-sm bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 shadow-2xs"></div>

        {/* Circular Coin */}
        <div className="relative mt-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-zinc-200 bg-gradient-to-b from-zinc-50 to-zinc-100 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)]">
          <Award className="h-5 w-5 text-zinc-400" />
        </div>

        <span className="mt-1 text-[8px] font-black tracking-widest text-zinc-400 uppercase">
          BID OPEN
        </span>
      </div>
    );
  }

  // 1st Place - Deluxe Gold Medal 🥇
  if (rank === 1) {
    return (
      <div className="group relative flex h-[82px] w-[82px] flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-amber-50/90 via-white to-amber-50/90 p-2 shadow-[0_6px_20px_rgba(245,158,11,0.3)] transition-transform duration-200 hover:scale-105">
        {/* Dual-Color Neck Ribbon */}
        <div className="flex h-2.5 w-7 items-center justify-center overflow-hidden rounded-t-sm shadow-2xs">
          <div className="h-full w-1/2 bg-red-600"></div>
          <div className="h-full w-1/2 bg-blue-700"></div>
        </div>

        {/* Circular Gold Medal */}
        <div className="relative mt-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-300 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_3px_8px_rgba(180,83,9,0.4)]">
          {/* Inner Laurel Wreath Ring */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/80 bg-gradient-to-b from-yellow-300 to-amber-500 shadow-inner">
            <span className="text-xl font-black text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              1
            </span>
          </div>

          {/* Sparkle Star */}
          <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-yellow-100 animate-pulse drop-shadow-sm" />
        </div>

        <span className="mt-1 text-[8px] font-black tracking-widest text-amber-900 uppercase">
          1ST RANK
        </span>
      </div>
    );
  }

  // 2nd Place - Deluxe Silver Medal 🥈
  if (rank === 2) {
    return (
      <div className="group relative flex h-[82px] w-[82px] flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-slate-50/90 via-white to-slate-100/90 p-2 shadow-[0_6px_20px_rgba(100,116,139,0.25)] transition-transform duration-200 hover:scale-105">
        {/* Ribbon */}
        <div className="flex h-2.5 w-7 items-center justify-center overflow-hidden rounded-t-sm shadow-2xs">
          <div className="h-full w-1/2 bg-blue-700"></div>
          <div className="h-full w-1/2 bg-slate-400"></div>
        </div>

        {/* Circular Silver Medal */}
        <div className="relative mt-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-300 bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),0_3px_8px_rgba(51,65,85,0.3)]">
          {/* Inner Ring */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-gradient-to-b from-slate-200 to-slate-400 shadow-inner">
            <span className="text-xl font-black text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              2
            </span>
          </div>
        </div>

        <span className="mt-1 text-[8px] font-black tracking-widest text-slate-700 uppercase">
          2ND RANK
        </span>
      </div>
    );
  }

  // 3rd Place - Deluxe Bronze Medal 🥉
  if (rank === 3) {
    return (
      <div className="group relative flex h-[82px] w-[82px] flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-orange-50/90 via-white to-amber-100/90 p-2 shadow-[0_6px_20px_rgba(194,65,12,0.25)] transition-transform duration-200 hover:scale-105">
        {/* Ribbon */}
        <div className="flex h-2.5 w-7 items-center justify-center overflow-hidden rounded-t-sm shadow-2xs">
          <div className="h-full w-1/2 bg-emerald-700"></div>
          <div className="h-full w-1/2 bg-orange-600"></div>
        </div>

        {/* Circular Bronze Medal */}
        <div className="relative mt-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-600 bg-gradient-to-tr from-amber-700 via-orange-300 to-amber-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_3px_8px_rgba(120,53,15,0.35)]">
          {/* Inner Ring */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/80 bg-gradient-to-b from-amber-400 to-amber-700 shadow-inner">
            <span className="text-xl font-black text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
              3
            </span>
          </div>
        </div>

        <span className="mt-1 text-[8px] font-black tracking-widest text-amber-900 uppercase">
          3RD RANK
        </span>
      </div>
    );
  }

  // 4th Place or higher - Brand Blue Medallion 🏅
  return (
    <div className="group relative flex h-[82px] w-[82px] flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-blue-50/90 via-white to-blue-100/90 p-2 shadow-[0_6px_20px_rgba(0,115,188,0.2)] transition-transform duration-200 hover:scale-105">
      {/* Ribbon */}
      <div className="flex h-2.5 w-7 items-center justify-center rounded-t-sm bg-gradient-to-r from-blue-700 via-sky-500 to-blue-700 shadow-2xs"></div>

      {/* Circular Medal */}
      <div className="relative mt-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-blue-400 bg-gradient-to-tr from-blue-600 via-sky-400 to-blue-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),0_3px_8px_rgba(30,58,138,0.3)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200/80 bg-gradient-to-b from-sky-400 to-blue-700 shadow-inner">
          <span className="text-sm font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            #{rank}
          </span>
        </div>
      </div>

      <span className="mt-1 text-[8px] font-black tracking-widest text-blue-900 uppercase">
        RANK #{rank}
      </span>
    </div>
  );
}
