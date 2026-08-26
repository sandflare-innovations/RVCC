import { Skeleton } from "@/components/ui";

export default function VendorDetailLoading() {
  return (
    <div className="h-full overflow-y-auto bg-white animate-pulse [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="w-full px-8 py-8 space-y-8 pb-24">
        {/* Back Button */}
        <Skeleton className="h-4 w-32" />

        {/* Header Profile Section */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex items-start gap-6 relative z-10">
            <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
            <div className="flex flex-col justify-center py-1 space-y-2">
              <Skeleton className="h-8 w-56" />
              <div className="flex items-center gap-2 mt-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration Card */}
          <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-9 w-36 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Security & Access Card */}
          <div className="col-span-1 bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={i > 0 ? "pt-3 border-t border-zinc-100" : ""}>
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lists Layout (Quotes & Invites) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quotes Section */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="divide-y divide-zinc-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex justify-between items-start gap-4">
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
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <div className="divide-y divide-zinc-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex justify-between items-start gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} className="space-y-6">
              {Array.from({ length: 2 }).map((_, section) => (
                <div key={section} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <Skeleton className="h-4 w-36 mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, row) => (
                      <div key={row} className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-3 last:border-0">
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
