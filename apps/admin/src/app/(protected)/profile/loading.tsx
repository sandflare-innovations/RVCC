import { Skeleton } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="animate-pulse space-y-8 pb-12">
          {/* Hero Banner Skeleton */}
          <div className="relative min-h-[280px] overflow-hidden rounded-[2.5rem] bg-zinc-200 p-8 md:p-12">
            <Skeleton className="absolute top-6 right-6 z-20 h-11 w-32 rounded-2xl bg-zinc-300/50 md:top-8 md:right-8" />
            <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-300/30 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center">
              <Skeleton className="h-28 w-28 rounded-2xl bg-zinc-300/50" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-9 w-56 bg-zinc-300/50" />
                <Skeleton className="h-5 w-48 bg-zinc-300/50" />
                <div className="mt-4 flex gap-3">
                  <Skeleton className="h-7 w-28 rounded-full bg-zinc-300/50" />
                  <Skeleton className="h-7 w-24 rounded-full bg-zinc-300/50" />
                  <Skeleton className="h-7 w-32 rounded-full bg-zinc-300/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <Skeleton className="mb-5 h-5 w-36" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-zinc-100 py-2.5 last:border-0"
                  >
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <Skeleton className="mb-5 h-5 w-24" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-zinc-100 py-2.5 last:border-0"
                  >
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
