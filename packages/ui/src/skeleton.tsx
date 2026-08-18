/**
 * Shapes that match what replaces them. A mismatched skeleton shifts the page
 * when real content lands, which feels slower than no skeleton at all.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-zinc-200 motion-reduce:animate-none ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3 last:border-0">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="ml-auto h-4 w-16" />
    </div>
  );
}
