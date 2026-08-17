import { pageCount, pageWindow, parsePage, summariseVendorPerformance } from "@repo/rfq";
import { Pagination } from "@repo/ui";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Ninety days. An all-time average hides a supplier who has recently stopped replying. */
const WINDOW_DAYS = 90;

export default async function SupplierPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = parsePage(rawPage);
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);

  const [total, vendors] = await Promise.all([
    prisma.vendorUser.count({ where: { isActive: true } }),
    prisma.vendorUser.findMany({
      where: { isActive: true },
      select: {
        email: true,
        _count: {
          select: {
            invites: { where: { createdAt: { gte: since } } },
            quotes: { where: { status: "SUBMITTED", submittedAt: { gte: since } } },
          },
        },
        quotes: {
          where: { status: "SUBMITTED", awardedFor: { isNot: null } },
          select: { id: true },
        },
      },
      orderBy: { email: "asc" },
      ...pageWindow(page),
    }),
  ]);

  const performance = summariseVendorPerformance(
    vendors.map((v) => ({
      email: v.email,
      invited: v._count.invites,
      submitted: v._count.quotes,
      won: v.quotes.length,
    }))
  );

  const pages = pageCount(total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Supplier performance
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Response and win rates over the last {WINDOW_DAYS} days.
        </p>
      </div>

      {performance.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          No active suppliers yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs tracking-wide text-zinc-600 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Supplier</th>
                <th className="px-4 py-3 font-semibold">Invited</th>
                <th className="px-4 py-3 font-semibold">Quoted</th>
                <th className="px-4 py-3 font-semibold">Response</th>
                <th className="px-4 py-3 font-semibold">Won</th>
                <th className="px-4 py-3 font-semibold">Win rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {performance.map((p) => (
                <tr key={p.email} className="transition-colors hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-950">{p.email}</td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.invited}</td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.submitted}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {/* Never invited reads as a dash: 0% would imply they ignored us. */}
                    <span
                      className={
                        p.invited > 0 && p.responseRate < 50
                          ? "font-semibold text-red-700"
                          : "text-zinc-700"
                      }
                    >
                      {p.invited === 0 ? "—" : `${p.responseRate}%`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.won}</td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">
                    {p.submitted === 0 ? "—" : `${p.winRate}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        total={total}
        noun="suppliers"
        href={(n) => `/vendors/performance?page=${n}`}
      />
    </div>
  );
}
