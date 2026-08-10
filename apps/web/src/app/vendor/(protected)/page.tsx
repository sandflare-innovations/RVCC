import { redirect } from "next/navigation";

import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { prisma } from "@/lib/db";
import { getVendorFromSession } from "@/lib/vendor/session";
import { StatusBadge } from "@/sections/admin/StatusBadge";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-2 last:border-0">
      <dt className="text-sm text-zinc-600">{label}</dt>
      <dd className="text-sm break-words text-zinc-950">{value?.trim() || "—"}</dd>
    </div>
  );
}

export default async function VendorDashboard() {
  const vendor = await getVendorFromSession();
  if (!vendor) redirect("/vendor/login");

  // Nothing is reachable until the temporary password has been replaced.
  if (vendor.mustChangePassword) redirect("/vendor/password");

  const registration = await prisma.supplierRegistration.findUnique({
    where: { id: vendor.registrationId },
    include: {
      company: true,
      contacts: { orderBy: { sortOrder: "asc" } },
      addresses: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!registration) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        We could not find your registration. Please contact RVCC procurement.
      </p>
    );
  }

  const categories = registration.productCategories
    .map((cid) => ENQUIRE_CATEGORIES.find((c) => c.id === cid)?.label ?? cid)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          {registration.company?.legalName || "Your registration"}
        </h1>
        <StatusBadge status={registration.status} />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
          Registration
        </h2>
        <dl>
          <Row label="Reference" value={registration.referenceNumber} />
          <Row
            label="Submitted"
            value={registration.submittedAt?.toLocaleDateString("en-GB") ?? null}
          />
          <Row
            label="Relationship"
            value={registration.businessRelationship.replace("_", " ").toLowerCase()}
          />
          <Row label="Contact email" value={registration.email} />
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
          Company
        </h2>
        <dl>
          <Row label="Legal name" value={registration.company?.legalName} />
          <Row label="Trading name" value={registration.company?.dbaName} />
          <Row label="Country" value={registration.company?.country} />
          <Row label="Organization type" value={registration.company?.organizationType} />
          <Row label="Website" value={registration.company?.website} />
          <Row label="Products & services" value={categories} />
        </dl>
      </section>

      <p className="text-sm text-zinc-600">
        To correct any of the details above, contact RVCC procurement — editing from the portal is
        not yet available.
      </p>
    </div>
  );
}
