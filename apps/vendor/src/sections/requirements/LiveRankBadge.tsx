"use client";

import { Medal } from "lucide-react";
import { useVendorLiveBidding } from "@/hooks/use-vendor-live-bidding";

export function LiveRankBadge({ requirementId }: { requirementId: string }) {
  const { data, status } = useVendorLiveBidding(requirementId);

  if (status !== "live" || !data) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-50 text-zinc-500 border border-zinc-200">
        <span className="relative flex h-1.5 w-1.5">
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-400"></span>
        </span>
        Connecting...
      </span>
    );
  }

  const rank = data.myRank;

  if (rank === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-50 text-zinc-600 border border-zinc-200">
        Not ranked
      </span>
    );
  }

  const getRankStyle = (r: number) => {
    if (r === 1) return "bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm";
    if (r === 2) return "bg-slate-50 text-slate-700 border-slate-200 shadow-sm";
    if (r === 3) return "bg-amber-50 text-amber-800 border-amber-200 shadow-sm";
    return "bg-brand-blue/5 text-brand-blue border-brand-blue/20";
  };

  const getRankIconStyle = (r: number) => {
    if (r === 1) return "text-yellow-500";
    if (r === 2) return "text-slate-400";
    if (r === 3) return "text-amber-700";
    return "text-brand-blue";
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border transition-colors ${getRankStyle(rank)}`}>
      {rank <= 3 ? (
        <Medal className={`h-3.5 w-3.5 drop-shadow-sm ${getRankIconStyle(rank)}`} />
      ) : (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
        </span>
      )}
      Live Rank #{rank}
    </span>
  );
}
