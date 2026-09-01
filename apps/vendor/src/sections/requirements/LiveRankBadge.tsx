"use client";

import { Crown } from "lucide-react";

import { useVendorLiveBidding } from "@/hooks/use-vendor-live-bidding";

export function LiveRankBadge({
  requirementId,
  fallbackRank,
  isEnded = false,
  isWon = false,
  className = "",
}: {
  requirementId: string;
  fallbackRank?: number | null;
  isEnded?: boolean;
  isWon?: boolean;
  className?: string;
}) {
  const { data, status } = useVendorLiveBidding(requirementId);

  const rank = status === "live" && data ? data.myRank : fallbackRank ?? null;

  // Winner Crown Medal if ended & won
  if (isWon) {
    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#005a96] via-[#0073bc] to-[#38bdf8] text-white shadow-xs border border-sky-300/80 ${className}`}
        title="Tender Awarded (Winner)"
      >
        <Crown className="h-4 w-4 text-white drop-shadow-xs" />
      </div>
    );
  }

  // 1st Position - Royal Deep Blue variant
  if (rank === 1) {
    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#005a96] via-[#0073bc] to-[#38bdf8] font-black text-white shadow-xs border border-sky-300/70 text-xs ${className}`}
        title="Rank #1 (Leading Lowest Offer)"
      >
        #1
      </div>
    );
  }

  // 2nd Position - Cobalt / Azure Blue variant
  if (rank === 2) {
    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#1e40af] via-[#3b82f6] to-[#93c5fd] font-black text-white shadow-xs border border-blue-300/60 text-xs ${className}`}
        title="Rank #2"
      >
        #2
      </div>
    );
  }

  // 3rd Position - Sky / Ocean Blue variant
  if (rank === 3) {
    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#0284c7] via-[#38bdf8] to-[#bae6fd] font-black text-sky-950 shadow-xs border border-sky-200 text-xs ${className}`}
        title="Rank #3"
      >
        #3
      </div>
    );
  }

  // 4th+ Position - Soft Ice Brand Blue variant
  if (rank != null && rank > 3) {
    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 font-bold text-brand-blue border border-brand-blue/20 text-xs ${className}`}
        title={`Rank #${rank}`}
      >
        #{rank}
      </div>
    );
  }

  // Unranked / Draft
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-400 border border-zinc-200 text-xs ${className}`}
      title="Not Ranked"
    >
      —
    </div>
  );
}
