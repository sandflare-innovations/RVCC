import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full relative">
      <div className="flex-none flex items-center justify-between bg-white pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Skeleton className="h-20 w-20 rounded-2xl mb-6" />
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-4 w-96" />
          <div className="mt-8 flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-28 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
