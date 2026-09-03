import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex flex-none items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
        <Skeleton className="h-9 w-72 rounded-2xl" />
      </div>

      <div className="flex-1 overflow-y-auto pb-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-zinc-200/80 bg-white p-3.5 space-y-4">
              <Skeleton className="aspect-16/10 w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="border-t border-zinc-100 pt-3 flex justify-between">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
