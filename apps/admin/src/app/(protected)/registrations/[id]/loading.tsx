import { Skeleton } from "@/components/ui";

export default function RegistrationDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Back Button */}
      <Skeleton className="h-4 w-36" />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Review Note */}
      <div className="space-y-1 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Review Panel */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      {/* Company Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <Skeleton className="mb-3 h-4 w-20" />
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-2 last:border-0"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Contacts Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <Skeleton className="mb-3 h-4 w-32" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-md border border-zinc-100 p-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div
                  key={j}
                  className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-2 last:border-0"
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Addresses Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="space-y-4">
          <div className="space-y-2 rounded-md border border-zinc-100 p-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div
                key={j}
                className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-2 last:border-0"
              >
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Questionnaire Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-2 last:border-0"
            >
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>

      {/* Attachments Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <Skeleton className="mb-3 h-4 w-36" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
