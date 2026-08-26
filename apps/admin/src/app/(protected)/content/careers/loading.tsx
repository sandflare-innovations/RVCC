import { Skeleton } from "@/components/ui";

export default function CareersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
        <table className="w-full text-left text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-zinc-200 text-white">
              {['Title', 'Department', 'Location', 'State', 'Actions'].map((h, i) => (
                <th
                  key={h}
                  className={`px-6 py-3.5 font-semibold ${i === 0 ? 'rounded-l-2xl' : ''} ${i === 4 ? 'rounded-r-2xl text-right' : ''}`}
                >
                  <Skeleton className={`h-3 rounded bg-zinc-300 ${h === 'Title' ? 'w-12' : h === 'Actions' ? 'w-12' : 'w-18'}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl">
                <td className="px-6 py-4 rounded-l-2xl">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className="px-6 py-4 rounded-r-2xl text-right">
                  <Skeleton className="h-8 w-8 ml-auto rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
