import { Suspense } from "react";
import { Activity, TrendingUp, Search } from "lucide-react";
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
        <Activity className="h-10 w-10 text-red-400 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900">Failed to load market data</h3>
        <p className="text-sm text-zinc-500 mt-2">Could not connect to the API.</p>
      </div>
    );
  }

  const requirements = result.data;
  
  // Filter for OPEN requirements
  const openReqs = requirements.filter((r) => r.status === "OPEN");

  if (openReqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
        <div className="h-16 w-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center mb-6">
          <Search className="h-8 w-8 text-brand-blue" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900">No Active Live Bids</h3>
        <p className="text-zinc-500 mt-2 max-w-sm">
          There are currently no OPEN requirements in the live bidding phase. 
          When a requirement opens, it will appear here in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col h-[380px] overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 animate-pulse">
          <div className="h-5 w-3/4 bg-zinc-200 rounded mb-2" />
          <div className="h-3 w-1/2 bg-zinc-100 rounded" />
          <div className="flex-1 mt-6 bg-zinc-50 rounded-2xl border border-zinc-100" />
        </div>
      ))}
    </div>
  );
}

export default function LiveMarketPage() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
              <div className="bg-brand-blue/10 p-2 rounded-xl">
                <TrendingUp className="h-6 w-6 text-brand-blue" />
              </div>
              Live Market View
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              Monitor all active real-time bidding sessions across the network concurrently.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue" />
            </span>
            <span className="text-xs font-semibold text-brand-blue uppercase tracking-wider">Network Connected</span>
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
