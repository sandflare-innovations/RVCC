import { Suspense } from "react";
import { notFound } from "next/navigation";
import { adminSessionJson } from "@/lib/admin-data";
import { LiveMarketDetailView } from "@/sections/requirements/LiveMarketDetailView";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

type Payload = {
  requirement: {
    id: string;
    referenceNumber: string | null;
    scopeOfWork: string;
    project: string;
    sellingPrice: string | number | null;
    currency: string;
    closesAt: string;
    status: string;
    createdAt: string;
    awardedAt: string | null;
    awardedQuoteId: string | null;
    awardedByAdmin: { email: string } | null;
  };
  quotes: Array<{
    id: string;
    newPrice: string | number;
    remarks: string | null;
    quoteFileUrl: string | null;
    status: string;
    submittedAt: string | null;
    vendorUser?: { email: string; name: string | null };
    participantEmail?: string;
    participantName?: string | null;
  }>;
  invites: Array<{
    id: string;
    emailStatus: string;
    vendorUser?: { email: string };
    email?: string;
  }>;
};

function MarketDetailSkeleton() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="lg:col-span-7 h-[480px] rounded-3xl" />
        <Skeleton className="lg:col-span-5 h-[480px] rounded-3xl" />
      </div>
    </div>
  );
}

async function MarketDetailData({ id }: { id: string }) {
  const result = await adminSessionJson<Payload>(`/requirements/${encodeURIComponent(id)}`);
  
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-zinc-200 m-8">
        <p className="text-sm text-red-500 font-semibold">Could not load market data ({result.status}).</p>
      </div>
    );
  }

  return <LiveMarketDetailView initialPayload={result.data} />;
}

export default async function LiveMarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<MarketDetailSkeleton />}>
      <MarketDetailData id={id} />
    </Suspense>
  );
}

