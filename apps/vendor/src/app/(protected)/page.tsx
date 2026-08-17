import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { type VendorRequirementRow, summariseVendorDashboard } from "@/lib/rfq";
import { KpiCard, StatusBadge } from "@/lib/ui";

import { VENDOR_COOKIE } from "@/lib/constants";
import { getVendorFromSession } from "@/lib/session";
import { vendorWorkerFetch } from "@/lib/vendor-api";
import { OverviewNextActions } from "@/sections/OverviewNextActions";

export const dynamic = "force-dynamic";

type DashboardPayload = {
  registration: {
    status: string;
    referenceNumber: string | null;
    submittedAt: string | null;
    email: string;
    businessRelationship: string;
    productCategories: string[];
    company: {
      legalName: string;
      dbaName: string;
      country: string;
      organizationType: string;
      website: string;
    } | null;
  } | null;
  requirements: VendorRequirementRow[];
};

export default async function VendorOverview() {
  // Session already gated in layout. Cache hits here.
  const vendor = await getVendorFromSession();
  if (!vendor) return null;
  // Safety if x-pathname header was unavailable in layout.
  if (vendor.mustChangePassword) redirect("/password");

  const token = (await cookies()).get(VENDOR_COOKIE)?.value;

  let payload: DashboardPayload = { registration: null, requirements: [] };
  try {
    const res = await vendorWorkerFetch("/dashboard", { method: "GET", sessionToken: token });
    if (res.ok) payload = (await res.json()) as DashboardPayload;
  } catch (err) {
    // A failed overview must still render a usable page with working links.
    console.error("[vendor] dashboard fetch failed", err);
  }

  const { counts, nextActions } = summariseVendorDashboard({ requirements: payload.requirements });
  const companyName = payload.registration?.company?.legalName;

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
            {payload.registration ? (
              <>
                <StatusBadge status={payload.registration.status} />
                {payload.registration.referenceNumber ? (
                  <span className="font-mono text-xs tabular-nums">
                    {payload.registration.referenceNumber}
                  </span>
                ) : null}
              </>
            ) : (
              <span>Account set up by RVCC</span>
            )}
          </div>
        </div>
        <Link
          href="/requirements"
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
