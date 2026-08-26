import { Skeleton } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full">
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="animate-pulse space-y-8 pb-12">
          {/* Hero Banner Skeleton */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-200 p-8 md:p-12 min-h-[280px]">
            <Skeleton className="absolute top-6 right-6 md:top-8 md:right-8 h-11 w-32 rounded-2xl bg-zinc-300/50 z-20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-300/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
              <Skeleton className="h-28 w-28 rounded-2xl bg-zinc-300/50" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-9 w-56 bg-zinc-300/50" />
                <Skeleton className="h-5 w-48 bg-zinc-300/50" />
                <div className="flex gap-3 mt-4">
                  <Skeleton className="h-7 w-28 rounded-full bg-zinc-300/50" />
                  <Skeleton className="h-7 w-24 rounded-full bg-zinc-300/50" />
                  <Skeleton className="h-7 w-32 rounded-full bg-zinc-300/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <Skeleton className="h-5 w-36 mb-5" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <Skeleton className="h-5 w-24 mb-5" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-16" />
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
