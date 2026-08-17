import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { type VendorRequirementRow, summariseVendorDashboard } from "@repo/rfq";
import { KpiCard, StatusBadge } from "@repo/ui";

import { VENDOR_COOKIE } from "@/lib/constants";
import { getVendorFromSession } from "@/lib/session";
import { vendorApiFetch } from "@/lib/vendor-api";
import { OverviewNextActions } from "@/sections/OverviewNextActions";

export const dynamic = "force-dynamic";

type DashboardRegistration = {
  email: string;
  status: string;
  referenceNumber: string | null;
  submittedAt: string | null;
  businessRelationship: string;
  productCategories: string[];
  company: {
    legalName: string;
    dbaName: string;
    country: string;
    organizationType: string;
    website: string;
  } | null;
};

type DashboardPayload = {
  registration: DashboardRegistration | null;
  requirements: VendorRequirementRow[];
};

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid gap-1 border-t border-zinc-100 py-3 first:border-t-0 sm:grid-cols-3">
      <dt className="text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase">{label}</dt>
      <dd className="text-sm text-zinc-800 sm:col-span-2">{value || "—"}</dd>
    </div>
  );
}

export default async function VendorDashboard() {
  const vendor = await getVendorFromSession();
  if (!vendor) return null;
  if (vendor.mustChangePassword) redirect("/portal/password");

  const token = (await cookies()).get(VENDOR_COOKIE)?.value;
  let payload: DashboardPayload = { registration: null, requirements: [] };
  let loadError: number | null = null;

  try {
    const res = await vendorApiFetch("/dashboard", { method: "GET", sessionToken: token });
    if (res.ok) {
      payload = (await res.json()) as DashboardPayload;
    } else {
      loadError = res.status;
    }
  } catch (err) {
    console.error("[vendor] dashboard fetch failed", err);
    loadError = 503;
  }

  if (loadError) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        Could not load dashboard ({loadError}).
      </p>
    );
  }

  const { counts, nextActions } = summariseVendorDashboard({ requirements: payload.requirements });
  const registration = payload.registration;
  const companyName = registration?.company?.legalName;
  const submitted =
    registration?.submittedAt != null
      ? new Date(registration.submittedAt).toLocaleDateString("en-GB")
      : null;

  const kpis = [
    { label: "Open invitations", value: counts.open },
    { label: "Due in 48h", value: counts.dueSoon },
    { label: "Submitted", value: counts.submitted },
    { label: "Drafts", value: counts.drafts },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            {companyName || vendor.name || vendor.email}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            {registration ? (
              <>
                <StatusBadge status={registration.status} />
                {registration.referenceNumber ? (
                  <span className="font-mono text-xs tabular-nums">
                    {registration.referenceNumber}
                  </span>
                ) : null}
              </>
            ) : (
              <span>Account set up by RVCC</span>
            )}
          </div>
        </div>
        <Link
          href="/portal/requirements"
          className="bg-brand-blue focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          View requirements
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
          Registration
        </h2>
        {registration ? (
          <dl>
            <Row label="Reference" value={registration.referenceNumber} />
            <Row label="Submitted" value={submitted} />
            <Row
              label="Relationship"
              value={registration.businessRelationship.replace("_", " ").toLowerCase()}
            />
            <Row label="Contact email" value={registration.email} />
          </dl>
        ) : (
          <p className="text-sm text-zinc-600">
            Your account was set up by RVCC, so there is no registration form to show here.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-[0.12em] text-zinc-600 uppercase">
          Your next actions
        </h2>
        <OverviewNextActions actions={nextActions} />
      </section>

      <p className="text-sm text-zinc-600">
        To correct your company details, contact RVCC procurement. Editing from the portal is not
        yet available.
      </p>
    </div>
  );
}
