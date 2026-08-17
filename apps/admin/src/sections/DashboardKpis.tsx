import { KpiCard } from "@repo/ui";

import { prisma } from "@/lib/db";

const REGISTRATION_CARDS = [
  { key: "SUBMITTED", label: "Awaiting review", href: "/registrations?status=SUBMITTED" },
  { key: "APPROVED", label: "Approved", href: "/registrations?status=APPROVED" },
  { key: "REJECTED", label: "Rejected", href: "/registrations?status=REJECTED" },
  { key: "DRAFT", label: "In progress", href: "/registrations?status=DRAFT" },
] as const;

export async function DashboardKpis() {
  const now = new Date();
  const in48h = new Date(Date.now() + 48 * 3_600_000);

  const [grouped, activeVendors, openCount, closingSoon, awaitingAward] = await Promise.all([
    prisma.supplierRegistration.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.vendorUser.count({ where: { isActive: true } }),
    prisma.requirement.count({ where: { status: "OPEN", closesAt: { gt: now } } }),
    prisma.requirement.count({ where: { status: "OPEN", closesAt: { gt: now, lte: in48h } } }),
    prisma.requirement.count({ where: { status: "OPEN", closesAt: { lte: now } } }),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

  const cards = [
    { label: "Active suppliers", value: activeVendors, href: "/vendors" },
    { label: "Open requirements", value: openCount, href: "/requirements" },
    { label: "Closing in 48h", value: closingSoon, href: "/requirements" },
    { label: "Awaiting award", value: awaitingAward, href: "/requirements" },
    ...REGISTRATION_CARDS.map((card) => ({
      label: card.label,
      value: counts[card.key] ?? 0,
      href: card.href,
    })),
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <KpiCard key={card.label} label={card.label} value={card.value} href={card.href} />
      ))}
    </div>
  );
}
