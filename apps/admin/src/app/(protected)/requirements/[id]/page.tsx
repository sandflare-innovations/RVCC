import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { RequirementPipelineView } from "@/sections/requirements/RequirementPipelineView";

export const dynamic = "force-dynamic";

async function RequirementData({ id }: { id: string }) {
  const result = await adminSessionJson<any>(`/requirements/${encodeURIComponent(id)}`);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        Could not load requirement ({result.status}).
      </p>
    );
  }

  return (
    <RequirementPipelineView
      data={{
        requirement: result.data.requirement,
        quotes: result.data.quotes || [],
        invites: result.data.invites || [],
        manualQuotations: result.data.manualQuotations || [],
        quotationStats: result.data.quotationStats || { count: 0, lowest: null, highest: null, average: null },
      }}
    />
  );
}

function RequirementDetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default async function RequirementComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<RequirementDetailSkeleton />}>
      <RequirementData id={id} />
    </Suspense>
  );
}
