import Link from "next/link";

import { prisma } from "@/lib/db";
import { CreateRequirementForm, type ParticipantOption } from "@/sections/CreateRequirementForm";

export const dynamic = "force-dynamic";

function formatDateTime(d: Date) {
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Closed is not a stored status — it is closesAt in the past. */
function statusLabel(status: string, closesAt: Date) {
  if (status === "OPEN" && closesAt.getTime() <= Date.now()) return "Closed";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function RequirementsPage() {
  const [requirements, vendors] = await Promise.all([
    prisma.requirement.findMany({
      include: {
        _count: { select: { invites: true } },
        quotes: { where: { status: "SUBMITTED" }, select: { id: true } },
      },
      orderBy: [{ closesAt: "asc" }],
      take: 100,
    }),
    prisma.vendorUser.findMany({
      where: { isActive: true },
      select: { id: true, email: true, name: true },
      orderBy: { email: "asc" },
    }),
  ]);

  const toOption = (p: { id: string; email: string; name: string }): ParticipantOption => ({
    id: p.id,
    label: p.name ? `${p.name} (${p.email})` : p.email,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Requirements</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Work put out to quote. Each invited supplier submits a price without seeing anyone
          else&apos;s.
        </p>
      </div>

      <CreateRequirementForm vendors={vendors.map(toOption)} />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs tracking-wide text-zinc-600 uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Closes</th>
              <th className="px-4 py-3 font-semibold">Invited</th>
              <th className="px-4 py-3 font-semibold">Quotes</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {requirements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Nothing posted yet.
                </td>
              </tr>
            ) : (
              requirements.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/requirements/${r.id}`}
                      className="hover:text-brand-blue font-mono text-xs tabular-nums underline-offset-2 hover:underline"
                    >
                      {r.referenceNumber ?? "— draft —"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-950">{r.project}</td>
                  <td className="px-4 py-3 text-zinc-600 tabular-nums">
                    {formatDateTime(r.closesAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">{r._count.invites}</td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">{r.quotes.length}</td>
                  <td className="px-4 py-3 text-zinc-700">{statusLabel(r.status, r.closesAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
