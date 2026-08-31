import { Building2,KeyRound } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui";
import { VENDOR_COOKIE } from "@/lib/constants";
import { getVendorFromSession } from "@/lib/session";
import { vendorApiFetch } from "@/lib/vendor-api";

import { SignOutCard } from "./SignOutCard";

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
};

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid gap-1 border-t border-zinc-100 py-3 first:border-t-0 sm:grid-cols-3">
      <dt className="text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase">{label}</dt>
      <dd className="text-sm font-medium text-zinc-900 sm:col-span-2">{value || "—"}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  const vendor = await getVendorFromSession();
  if (!vendor) redirect("/login");

  const token = (await cookies()).get(VENDOR_COOKIE)?.value;
  let payload: DashboardPayload = { registration: null };

  try {
    const res = await vendorApiFetch("/dashboard", { method: "GET", sessionToken: token });
    if (res.ok) {
      payload = (await res.json()) as DashboardPayload;
    }
  } catch (err) {
    console.error("[profile] dashboard fetch failed", err);
  }

  const registration = payload.registration;
  const submitted =
    registration?.submittedAt != null
      ? new Date(registration.submittedAt).toLocaleDateString("en-GB")
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">My Profile</h1>
        <p className="mt-1 text-sm text-zinc-600">Manage your account settings and preferences.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-brand-blue/10 text-brand-blue flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
            {(vendor.name || vendor.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">{vendor.name || "Vendor User"}</h2>
            <p className="text-sm text-zinc-500">{vendor.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/password"
          className="hover:border-brand-blue flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">Change Password</h3>
            <p className="text-xs text-zinc-500">Update your security credentials</p>
          </div>
        </Link>

        <SignOutCard />
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all">
        <div className="border-b border-zinc-200/80 bg-zinc-50/50 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-bold tracking-wide text-zinc-900 uppercase">
              <Building2 className="text-brand-blue h-4 w-4" />
              Registration Details
            </div>
            {registration ? (
              <div className="flex items-center gap-2">
                <StatusBadge status={registration.status} />
                {registration.referenceNumber && (
                  <span className="inline-flex items-center rounded-lg border border-zinc-200/60 bg-white px-2 py-1 font-mono text-[10px] font-semibold tracking-wider text-zinc-700 tabular-nums shadow-sm">
                    Ref: {registration.referenceNumber}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
        <div className="p-6">
          {registration ? (
            <dl className="space-y-2">
              <Row label="Reference" value={registration.referenceNumber} />
              <Row label="Submitted" value={submitted} />
              <Row
                label="Relationship"
                value={registration.businessRelationship.replace("_", " ").toLowerCase()}
              />
              <Row label="Contact email" value={registration.email} />
            </dl>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-500">
              Your account was set up by RVCC, so there is no registration form to show here.
            </p>
          )}
        </div>
        <div className="border-t border-zinc-200/80 bg-zinc-50/50 px-6 py-4 text-xs leading-relaxed font-medium text-zinc-500">
          To correct your company details, contact RVCC procurement. Editing from the portal is not
          yet available.
        </div>
      </section>
    </div>
  );
}
