import { Skeleton } from "@/components/ui";

export default function NewRequirementLoading() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full relative animate-pulse">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-zinc-200/70 bg-white/95 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
            <Skeleton className="h-5 w-5" />
          </div>
          <Skeleton className="h-6 w-44" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
      </div>

      <div className="flex-1">
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* Left Column: Core Details */}
            <div className="flex flex-col">
              <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-4 mb-6">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-36" />
                </div>

                <div className="flex flex-col md:flex-row gap-8 flex-1">
                  {/* File Upload Area */}
                  <div className="w-full md:w-64 shrink-0 flex flex-col">
                    <Skeleton className="h-4 w-44 mb-2" />
                    <div className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-4 w-32 mt-4" />
                      <Skeleton className="h-3 w-24 mt-2" />
                    </div>
                  </div>

                  {/* Text Fields */}
                  <div className="flex-1 space-y-6 flex flex-col">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                    <div className="flex-1 flex flex-col mt-6 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="flex-1 min-h-[200px] w-full rounded-xl" />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Metadata & Deadlines */}
            <div className="flex flex-col">
              <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm flex flex-col h-full space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-40" />
                </div>

                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Suppliers Section */}
          <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-72 mt-2" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
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
