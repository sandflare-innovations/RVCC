import Link from "next/link";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const CARDS = [
  { key: "SUBMITTED", label: "Awaiting review", href: "/registrations?status=SUBMITTED" },
  { key: "APPROVED", label: "Approved", href: "/registrations?status=APPROVED" },
  { key: "REJECTED", label: "Rejected", href: "/registrations?status=REJECTED" },
  { key: "DRAFT", label: "In progress", href: "/registrations?status=DRAFT" },
] as const;

export default async function AdminDashboard() {
  const grouped = await prisma.supplierRegistration.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">Vendor registration overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="hover:border-brand-blue rounded-lg border border-zinc-200 bg-white p-5 transition-colors"
          >
            <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">
              {c.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-zinc-950 tabular-nums">
              {counts[c.key] ?? 0}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
