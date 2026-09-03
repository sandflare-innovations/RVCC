import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryLoading() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {/* Sticky Bar Skeleton */}
      <div className="-mx-5 -mt-5 md:-mx-8 md:-mt-8 mb-6 border-b border-zinc-200/80 bg-white px-5 md:px-8 py-3.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-44 rounded-2xl" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-32 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full lg:w-72 rounded-2xl" />
      </div>

      <div className="flex-1 overflow-y-auto pb-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-zinc-200/80 bg-white p-5 space-y-3">
              <Skeleton className="aspect-16/10 w-full rounded-2xl" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="aspect-square rounded-xl" />
              </div>
              <div className="pt-2 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <div className="border-t border-zinc-100 pt-3 flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
