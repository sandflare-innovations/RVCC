import { redirect } from "next/navigation";

import { StatusBadge } from "@repo/ui";

import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { prisma } from "@/lib/db";
import { getVendorFromSession } from "@/lib/session";

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
  // Session already gated in layout. Cache hits here.
  const vendor = await getVendorFromSession();
  if (!vendor) return null;
  // Safety if x-pathname header was unavailable in layout.
  if (vendor.mustChangePassword) redirect("/password");

  // Admin-created vendors have no registration to show. Skip the query entirely
  // rather than passing null into findUnique, which throws. Bound to a local so
  // the null check narrows the type inside the query.
  const registrationId = vendor.registrationId;
  const registration = registrationId
    ? await prisma.supplierRegistration.findUnique({
        where: { id: registrationId },
        select: {
          email: true,
          status: true,
          referenceNumber: true,
          submittedAt: true,
          businessRelationship: true,
          productCategories: true,
          company: {
            select: {
              legalName: true,
              dbaName: true,
              country: true,
              organizationType: true,
              website: true,
            },
          },
        },
      })
    : null;

  if (!registration) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        {registrationId
          ? "We could not find your registration. Please contact RVCC procurement."
          : // Account created directly by RVCC — there is no registration to show,
            // and telling them one is "missing" would send them chasing support.
            "Your account was set up by RVCC, so there is no registration form to show here."}
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
