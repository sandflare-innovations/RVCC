"use client";

import { AlertCircle, ExternalLink,Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAdminLiveBidding } from "@/hooks/use-admin-live-bidding";

import { LiveBiddingGraph } from "./LiveBiddingGraph";

interface LiveMarketCardProps {
  requirementId: string;
  projectTitle: string;
  currency: string;
  closesAt: string;
}

export function LiveMarketCard({
  requirementId,
  projectTitle,
  currency,
  closesAt,
}: LiveMarketCardProps) {
  const router = useRouter();
  const { data: liveData, status, errorMsg } = useAdminLiveBidding(requirementId);

  const href = `/live-market/${requirementId}`;

  function handleNavigate() {
    router.push(href);
  }

  return (
    <div
      className="hover:border-brand-blue/40 group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_4px_16px_-4px_rgba(15,23,42,0.06)] transition-all duration-200 hover:shadow-[0_12px_32px_-12px_rgba(0,115,188,0.20)]"
      role="link"
      tabIndex={0}
      aria-label={`Open live market for ${projectTitle}`}
      onClick={handleNavigate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleNavigate();
      }}
    >
      {/* Card Header — always clickable */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/40 px-5 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="group-hover:text-brand-blue truncate text-sm font-bold text-zinc-900 transition-colors sm:text-base">
              {projectTitle}
            </h3>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-700 uppercase">
              {currency}
            </span>
            <span>•</span>
            <span className="truncate" suppressHydrationWarning>
              Closes{" "}
              {new Date(closesAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Live Indicator + Action Icon */}
        <div className="flex shrink-0 items-center gap-2">
          {errorMsg && !liveData ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
              <AlertCircle className="h-2.5 w-2.5" />
              Paused
            </span>
          ) : status === "connecting" && !liveData ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Connecting
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          )}
          <div className="group-hover:bg-brand-blue flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition-colors group-hover:text-white">
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Card Body: Full-width Graph.
          The graph area also has an onClick so any click through the SVG canvas still navigates. */}
      <div
        className="relative flex min-h-[340px] flex-1 flex-col p-4 sm:p-5"
        onClick={handleNavigate}
      >
        {liveData ? (
          <div className="flex h-full w-full flex-1 flex-col">
            <LiveBiddingGraph data={liveData} showMetrics={false} />
          </div>
        ) : errorMsg ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50/60 p-6 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xs font-bold text-zinc-900">Live Feed Disconnected</p>
            <p className="mt-1 line-clamp-2 max-w-[240px] text-[11px] text-zinc-500">{errorMsg}</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-zinc-50/50 p-6">
            <Loader2 className="text-brand-blue mb-2 h-6 w-6 animate-spin" />
            <p className="text-brand-blue text-[11px] font-bold tracking-wider uppercase">
              Loading Market Curve...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
