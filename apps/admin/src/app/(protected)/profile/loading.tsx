import { Skeleton } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-52 mt-2" />
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
