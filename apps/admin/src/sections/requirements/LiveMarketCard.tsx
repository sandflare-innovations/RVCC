"use client";

import { useRouter } from "next/navigation";
import { useAdminLiveBidding } from "@/hooks/use-admin-live-bidding";
import { LiveBiddingGraph } from "./LiveBiddingGraph";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface LiveMarketCardProps {
  requirementId: string;
  projectTitle: string;
  currency: string;
  closesAt: string;
}

export function LiveMarketCard({ requirementId, projectTitle, currency, closesAt }: LiveMarketCardProps) {
  const router = useRouter();
  const { data: liveData, status, errorMsg } = useAdminLiveBidding(requirementId);

  const href = `/live-market/${requirementId}`;

  function handleNavigate() {
    router.push(href);
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_4px_16px_-4px_rgba(15,23,42,0.06)] transition-all duration-200 hover:shadow-[0_12px_32px_-12px_rgba(0,115,188,0.20)] hover:border-brand-blue/40 group cursor-pointer"
      role="link"
      tabIndex={0}
      aria-label={`Open live market for ${projectTitle}`}
      onClick={handleNavigate}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNavigate(); }}
    >
      {/* Card Header — always clickable */}
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate group-hover:text-brand-blue transition-colors">
              {projectTitle}
            </h3>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono font-bold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded text-[10px] uppercase">{currency}</span>
            <span>•</span>
            <span className="truncate" suppressHydrationWarning>Closes {new Date(closesAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        {/* Live Indicator + Action Icon */}
        <div className="flex items-center gap-2 shrink-0">
          {errorMsg && !liveData ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <AlertCircle className="h-2.5 w-2.5" />
              Paused
            </span>
          ) : status === "connecting" && !liveData ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Connecting
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          )}
          <div className="h-7 w-7 rounded-full bg-zinc-100 group-hover:bg-brand-blue group-hover:text-white text-zinc-400 flex items-center justify-center transition-colors">
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Card Body: Full-width Graph.
          The graph area also has an onClick so any click through the SVG canvas still navigates. */}
      <div
        className="flex-1 p-4 sm:p-5 relative min-h-[340px] flex flex-col"
        onClick={handleNavigate}
      >
        {liveData ? (
          <div className="flex-1 w-full h-full flex flex-col">
            <LiveBiddingGraph data={liveData} showMetrics={false} />
          </div>
        ) : errorMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-zinc-50/60 rounded-2xl border border-zinc-100">
            <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xs font-bold text-zinc-900">Live Feed Disconnected</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[240px] line-clamp-2">
              {errorMsg}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-50/50 rounded-2xl">
            <Loader2 className="h-6 w-6 text-brand-blue animate-spin mb-2" />
            <p className="text-[11px] font-bold tracking-wider text-brand-blue uppercase">Loading Market Curve...</p>
          </div>
        )}
      </div>
    </div>
  );
}
