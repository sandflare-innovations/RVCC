import { Skeleton } from "@/components/ui";

export default function RequirementEditLoading() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full relative animate-pulse">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-zinc-200/70 bg-white/95 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
            <Skeleton className="h-5 w-5" />
          </div>
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
      </div>

      <div className="flex-1">
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* Left Column */}
            <div className="flex flex-col">
              <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-4 mb-6">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div className="flex flex-col md:flex-row gap-8 flex-1">
                  <div className="w-full md:w-64 shrink-0 space-y-1.5">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-zinc-200" />
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm flex flex-col h-full space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-40" />
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ))}
              </section>
            </div>
          </div>

          {/* Suppliers */}
          <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
              <div className="space-y-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
