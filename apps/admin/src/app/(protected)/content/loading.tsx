import { Skeleton } from "@/components/ui";

export default function ContentLoading() {
  return (
    <div className="relative flex h-full min-h-0 w-full animate-pulse flex-col">
      {/* Header */}
      <div className="flex flex-none items-center justify-between bg-white pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-1 h-4 w-48" />
          </div>
        </div>
      </div>

      <div className="flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-8 pb-12">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-8 shrink-0 rounded-2xl" />
                </div>
                <div className="relative z-10 mt-3">
                  <Skeleton className="h-7 w-10" />
                </div>
              </div>
            ))}
          </div>

          {/* Content Sections Grid */}
          <div>
            <Skeleton className="mb-4 h-5 w-36" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="mb-1 h-5 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="mt-1 h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
