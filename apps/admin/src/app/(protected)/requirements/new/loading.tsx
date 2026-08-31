import { Skeleton } from "@/components/ui";

export default function NewRequirementLoading() {
  return (
    <div className="relative flex h-full min-h-0 w-full animate-pulse flex-col">
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
        <div className="mx-auto w-full max-w-6xl space-y-8 p-6 pb-12 md:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Left Column: Core Details */}
            <div className="flex flex-col">
              <section className="flex h-full flex-col rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-36" />
                </div>

                <div className="flex flex-1 flex-col gap-8 md:flex-row">
                  {/* File Upload Area */}
                  <div className="flex w-full shrink-0 flex-col md:w-64">
                    <Skeleton className="mb-2 h-4 w-44" />
                    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="mt-4 h-4 w-32" />
                      <Skeleton className="mt-2 h-3 w-24" />
                    </div>
                  </div>

                  {/* Text Fields */}
                  <div className="flex flex-1 flex-col space-y-6">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                    <div className="mt-6 flex flex-1 flex-col space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="min-h-[200px] w-full flex-1 rounded-xl" />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Metadata & Deadlines */}
            <div className="flex flex-col">
              <section className="flex h-full flex-col space-y-6 rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm">
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

                <div className="flex-1 space-y-6">
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
          <section className="space-y-6 rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="mt-2 h-4 w-72" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
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
