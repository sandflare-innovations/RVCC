import { Skeleton } from "@/components/ui";

export default function VendorDetailLoading() {
  return (
    <div className="h-full animate-pulse [scrollbar-width:none] overflow-y-auto bg-white [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="w-full space-y-8 px-8 py-8 pb-24">
        {/* Back Button */}
        <Skeleton className="h-4 w-32" />

        {/* Header Profile Section */}
        <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm md:flex-row md:items-start">
          <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100 blur-3xl" />

          <div className="relative z-10 flex items-start gap-6">
            <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
            <div className="flex flex-col justify-center space-y-2 py-1">
              <Skeleton className="h-8 w-56" />
              <div className="mt-2 flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-36 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid Layout for Metrics & Registration */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Registration Card */}
          <div className="col-span-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:col-span-2">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-9 w-36 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Security & Access Card */}
          <div className="col-span-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="space-y-4 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={i > 0 ? "border-t border-zinc-100 pt-3" : ""}>
                  <Skeleton className="mb-1 h-3 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lists Layout (Quotes & Invites) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Quotes Section */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="divide-y divide-zinc-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invites Section */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <div className="divide-y divide-zinc-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full Registration Profile */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} className="space-y-6">
              {Array.from({ length: 2 }).map((_, section) => (
                <div
                  key={section}
                  className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <Skeleton className="mb-4 h-4 w-36" />
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, row) => (
                      <div
                        key={row}
                        className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-3 last:border-0"
                      >
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
