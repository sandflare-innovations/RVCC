import { Skeleton } from "@/components/ui";

export default function RequirementDetailLoading() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full relative animate-pulse">
      {/* Sticky Header */}
      <div className="flex-none flex items-center justify-between bg-white px-6 pb-4 pt-4 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
            <Skeleton className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 md:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">

          {/* Award Banner (conditional) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex items-center gap-4 shadow-sm">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* Requirement Details */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center gap-2.5">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-zinc-50 last:border-0">
                    <Skeleton className="h-3 w-28 mb-2 sm:mb-0" />
                    <Skeleton className={`h-4 ${i === 0 ? 'w-1/4' : i === 1 ? 'w-3/4' : i === 2 ? 'w-1/2' : 'w-full'}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Invited Vendors */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-5 w-6 rounded-full" />
              </div>
              <div className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5 pb-4 border-b border-zinc-100 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quotes Section */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center gap-2.5">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-zinc-100 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
