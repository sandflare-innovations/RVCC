import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AlertCircle, Building2, CheckCircle2, Clock, FileText, Inbox } from "lucide-react";

import { type VendorRequirementRow, summariseVendorDashboard } from "@/lib/rfq";
import { KpiCard, StatusBadge } from "@/components/ui";

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
      <dd className="text-sm font-medium text-zinc-900 sm:col-span-2">{value || "—"}</dd>
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">Could not load dashboard ({loadError}).</p>
        </div>
      </div>
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
    { label: "Open invitations", value: counts.open, icon: <Inbox className="h-4 w-4" /> },
    { label: "Due in 48h", value: counts.dueSoon, icon: <Clock className="h-4 w-4" /> },
    { label: "Submitted", value: counts.submitted, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: "Drafts", value: counts.drafts, icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            {companyName || vendor.name || vendor.email}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            {registration ? (
              <>
                <StatusBadge status={registration.status} />
                {registration.referenceNumber ? (
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs font-medium text-zinc-700 tabular-nums">
                    Ref: {registration.referenceNumber}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                Account set up by RVCC
              </span>
            )}
          </div>
        </div>
        <Link
          href="/portal/requirements"
          className="bg-brand-blue focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          View requirements
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-4 text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase">
              Your next actions
            </h2>
            <div className="rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
              <OverviewNextActions actions={nextActions} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Building2 className="h-4 w-4 text-zinc-500" />
                Registration Details
              </div>
            </div>
            <div className="p-5">
              {registration ? (
                <dl className="space-y-1">
                  <Row label="Reference" value={registration.referenceNumber} />
                  <Row label="Submitted" value={submitted} />
                  <Row
                    label="Relationship"
                    value={registration.businessRelationship.replace("_", " ").toLowerCase()}
                  />
                  <Row label="Contact email" value={registration.email} />
                </dl>
              ) : (
                <p className="text-sm text-zinc-500">
                  Your account was set up by RVCC, so there is no registration form to show here.
                </p>
              )}
            </div>
            <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-3 text-xs text-zinc-500">
              To correct your company details, contact RVCC procurement. Editing from the portal is
              not yet available.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
