import Link from "next/link";

/**
 * Server-rendered paging. Takes a href builder rather than a base path so each
 * list can preserve its own filters — paging must never silently drop the
 * search the user just typed.
 */
export function Pagination({
  page,
  pages,
  total,
  noun,
  href,
}: {
  page: number;
  pages: number;
  total: number;
  noun: string;
  href: (page: number) => string;
}) {
  const base =
    "focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 font-semibold text-zinc-700 transition-colors hover:border-zinc-400 focus-visible:ring-2 focus-visible:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50";

  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Pagination">
      <Link href={href(Math.max(1, page - 1))} aria-disabled={page <= 1} className={base}>
        Previous
      </Link>
      <span className="text-zinc-600 tabular-nums" aria-live="polite">
        Page {page} of {pages} · {total} {noun}
      </span>
      <Link href={href(Math.min(pages, page + 1))} aria-disabled={page >= pages} className={base}>
        Next
      </Link>
    </nav>
  );
}
