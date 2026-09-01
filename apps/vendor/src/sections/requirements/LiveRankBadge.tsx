"use client";

import { useVendorLiveBidding } from "@/hooks/use-vendor-live-bidding";

export function LiveRankBadge({
  requirementId,
  fallbackRank,
}: {
  requirementId: string;
  fallbackRank?: number | null;
}) {
  const { data, status } = useVendorLiveBidding(requirementId);

  const rank = status === "live" && data ? data.myRank : fallbackRank ?? null;

  if (rank === 1) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-400 font-black text-amber-950 shadow-xs border border-amber-300 text-xs"
        title="Rank #1 (Lowest Offer)"
      >
        #1
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-300 via-slate-100 to-slate-200 font-black text-slate-800 shadow-xs border border-slate-300 text-xs"
        title="Rank #2"
      >
        #2
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-700 via-orange-400 to-amber-600 font-black text-white shadow-xs border border-amber-600 text-xs"
        title="Rank #3"
      >
        #3
      </div>
    );
  }

  if (rank != null && rank > 3) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 font-bold text-brand-blue text-xs"
        title={`Rank #${rank}`}
      >
        #{rank}
      </div>
    );
  }

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 font-bold text-zinc-400 text-xs"
      title="Not Ranked"
    >
      —
    </div>
  );
}
