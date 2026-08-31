import { Activity, Search,TrendingUp } from "lucide-react";
import { Suspense } from "react";

import { adminSessionJson } from "@/lib/admin-data";
import { LiveMarketCard } from "@/sections/requirements/LiveMarketCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequirementItem = {
  id: string;
  project: string;
  referenceNumber: string | null;
  currency: string;
  status: "DRAFT" | "PENDING" | "OPEN" | "CLOSED" | "AWARDED" | "CANCELLED";
  closesAt: string;
  quotesCount: number;
};

async function LiveMarketGrid() {
  const result = await adminSessionJson<RequirementItem[]>("/requirements");
  if (!result.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Activity className="mb-4 h-10 w-10 text-red-400" />
        <h3 className="text-lg font-bold text-zinc-900">Failed to load market data</h3>
        <p className="mt-2 text-sm text-zinc-500">Could not connect to the API.</p>
      </div>
    );
  }

  const requirements = result.data;

  // Filter for OPEN requirements
  const openReqs = requirements.filter((r) => r.status === "OPEN");

  if (openReqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-24 text-center">
        <div className="bg-brand-blue/10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Search className="text-brand-blue h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900">No Active Live Bids</h3>
        <p className="mt-2 max-w-sm text-zinc-500">
          There are currently no OPEN requirements in the live bidding phase. When a requirement
          opens, it will appear here in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {openReqs.map((req) => (
        <LiveMarketCard
          key={req.id}
          requirementId={req.id}
          projectTitle={req.project}
          currency={req.currency}
          closesAt={req.closesAt}
        />
      ))}
    </div>
  );
}

function MarketSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex h-[380px] animate-pulse flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5"
        >
          <div className="mb-2 h-5 w-3/4 rounded bg-zinc-200" />
          <div className="h-3 w-1/2 rounded bg-zinc-100" />
          <div className="mt-6 flex-1 rounded-2xl border border-zinc-100 bg-zinc-50" />
        </div>
      ))}
    </div>
  );
}

export default function LiveMarketPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
              <div className="bg-brand-blue/10 rounded-xl p-2">
                <TrendingUp className="text-brand-blue h-6 w-6" />
              </div>
              Live Market View
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Monitor all active real-time bidding sessions across the network concurrently.
            </p>
          </div>

          <div className="bg-brand-blue/5 border-brand-blue/10 hidden items-center gap-2 rounded-2xl border px-4 py-2 md:flex">
            <span className="relative flex h-2 w-2">
              <span className="bg-brand-blue absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-brand-blue relative inline-flex h-2 w-2 rounded-full" />
            </span>
            <span className="text-brand-blue text-xs font-semibold tracking-wider uppercase">
              Network Connected
            </span>
          </div>
        </div>

        {/* Grid Stream */}
        <Suspense fallback={<MarketSkeleton />}>
          <LiveMarketGrid />
        </Suspense>
      </div>
    </div>
  );
}
