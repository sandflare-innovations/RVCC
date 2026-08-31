import {
  Building2,
  CalendarDays,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  History,
  KeyRound,
  Mail,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BackButton } from "@/components/ui/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { StatusBadge } from "@/lib/ui";

import { VendorProfileActions } from "./VendorProfileActions";

export const dynamic = "force-dynamic";

function formatDateTime(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string | null | undefined, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Payload = {
  vendor: {
    id: string;
    email: string;
    name: string | null;
    isActive: boolean;
    portalAccess: "RELEASED" | "HELD";
    mustChangePassword: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    lockedUntil: string | null;
    activeSessions: number;
    registrationId: string | null;
    companyName: string | null;
    referenceNumber: string | null;
    registrationStatus: string | null;
    registrationComplete: boolean;
    registration: {
      id: string;
      referenceNumber: string | null;
      status: string;
      company: { legalName: string } | null;
    } | null;
  };
  quotes: Array<{
    id: string;
    newPrice: string | number | null;
    status: string;
    submittedAt: string | null;
    requirementProject: string;
    requirementRef: string | null;
    requirementId: string;
  }>;
  invites: Array<{
    id: string;
    emailStatus: string;
    emailedAt: string | null;
    requirementProject: string;
    requirementRef: string | null;
    requirementId: string;
  }>;
};

/* ------------------------------------------------------------------ */
/*  Skeleton fallbacks                                                  */
/* ------------------------------------------------------------------ */

function VendorDetailSkeleton() {
  return (
    <div className="h-full [scrollbar-width:none] overflow-y-auto bg-white [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="w-full space-y-8 px-8 py-8 pb-24">
        <Skeleton className="h-9 w-32 rounded-lg" />

        {/* Header skeleton */}
        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm md:flex-row md:items-start">
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-2xl" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="mt-2 flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2">
            <Skeleton className="mb-4 h-5 w-48" />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lists skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-6">
              <Skeleton className="mb-4 h-5 w-32" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Async data component (streamed via Suspense)                       */
/* ------------------------------------------------------------------ */

async function VendorData({ id }: { id: string }) {
  const result = await adminSessionJson<Payload>(`/vendors/${encodeURIComponent(id)}`);

  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        Could not load vendor profile ({result.status}).
      </p>
    );
  }

  const { vendor, quotes, invites } = result.data;
  const isLocked = !!vendor.lockedUntil;

  return (
    <div className="h-full [scrollbar-width:none] overflow-y-auto bg-white [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="w-full space-y-8 px-8 py-8 pb-24">
        <BackButton label="Back to vendors" />

        {/* Premium Header Profile Section */}
        <div className="group hover:border-brand-blue/30 relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm transition-colors md:flex-row md:items-start">
          <div className="bg-brand-blue/5 pointer-events-none absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-start gap-6">
            <div className="from-brand-blue/10 to-brand-blue/5 border-brand-blue/20 flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-inner transition-transform duration-500 group-hover:scale-105">
              <span className="text-brand-blue text-3xl font-bold tracking-wider">
                {getInitials(vendor.name, vendor.email)}
              </span>
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                {vendor.name || "Unnamed Vendor"}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
                <Mail className="h-4 w-4" />
                <span>{vendor.email}</span>
              </div>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={vendor.isActive ? "ACTIVE" : "DISABLED"} />
                  <StatusBadge status={vendor.portalAccess === "RELEASED" ? "RELEASED" : "HELD"} />
                  {vendor.mustChangePassword && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                      <KeyRound className="h-3.5 w-3.5" />
                      Password reset required
                    </span>
                  )}
                </div>

                <div className="hidden h-8 w-px bg-zinc-200 sm:block"></div>

                <VendorProfileActions
                  vendor={{
                    id: vendor.id,
                    email: vendor.email,
                    portalAccess: vendor.portalAccess as "HELD" | "RELEASED",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grid Layout for Metrics & Registration */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Registration Card */}
          <div
            className={`col-span-1 ${vendor.registration ? "lg:col-span-2" : ""} overflow-hidden rounded-2xl border border-zinc-200 bg-white`}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <h3 className="flex items-center gap-2 font-semibold text-zinc-950">
                <Building2 className="h-4 w-4 text-zinc-500" />
                Company Registration
              </h3>
              {vendor.registration && <StatusBadge status={vendor.registrationStatus || "DRAFT"} />}
            </div>
            <div className="p-6">
              {vendor.registration ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-medium text-zinc-500">Company Legal Name</p>
                      <p className="text-sm font-medium text-zinc-950">
                        {vendor.companyName || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-zinc-500">Registration Ref #</p>
                      <p className="font-mono text-sm text-zinc-700">
                        {vendor.referenceNumber || "Draft"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                    <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                      {vendor.registrationComplete ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-500" /> Application submitted
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-amber-500" /> Application incomplete
                        </>
                      )}
                    </span>

                    <Link
                      href={`/registrations/${vendor.registrationId}`}
                      className="bg-brand-blue hover:bg-brand-blue/90 focus:ring-brand-blue/50 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors focus:ring-2 focus:ring-offset-1 focus:outline-none"
                    >
                      View Application
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                    <FileText className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-950">No Registration Linked</p>
                    <p className="mt-1 max-w-xs text-xs text-zinc-500">
                      This account was likely created manually and is not linked to a supplier
                      registration application.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security & Access Card */}
          <div className="col-span-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <h3 className="flex items-center gap-2 font-semibold text-zinc-950">
                <ShieldAlert className="h-4 w-4 text-zinc-500" />
                Security & Access
              </h3>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Account Created
                </p>
                <p className="text-sm text-zinc-950">{formatDateOnly(vendor.createdAt)}</p>
              </div>

              <div className="border-t border-zinc-100 pt-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <Clock className="h-3.5 w-3.5" />
                  Last Sign In
                </p>
                <p className="text-sm text-zinc-950">{formatDateTime(vendor.lastLoginAt)}</p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                <p className="text-xs font-medium text-zinc-500">Active Sessions</p>
                <p className="rounded-md bg-zinc-100 px-2 py-0.5 text-sm font-semibold text-zinc-950">
                  {vendor.activeSessions}
                </p>
              </div>

              {isLocked && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p>
                    Account is temporarily locked due to failed login attempts until{" "}
                    {formatDateTime(vendor.lockedUntil)}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lists Layout (Quotes & Invites) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Quotes Section */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <h3 className="flex items-center gap-2 font-semibold text-zinc-950">
                <FileText className="h-4 w-4 text-zinc-500" />
                Quotes ({quotes.length})
              </h3>
            </div>
            <div className="max-h-[400px] flex-1 overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200/80 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent">
              {quotes.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center p-6 text-sm text-zinc-500">
                  No quotes submitted yet.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {quotes.map((quote) => (
                    <li key={quote.id} className="p-4 transition-colors hover:bg-zinc-50">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/requirements/${quote.requirementId}`}
                            className="text-brand-blue text-sm font-medium hover:underline"
                          >
                            {quote.requirementProject}
                          </Link>
                          <p className="mt-1 font-mono text-xs text-zinc-500">
                            {quote.requirementRef || "Draft Ref"}
                          </p>
                        </div>
                        <StatusBadge status={quote.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                        <span>Submitted: {formatDateOnly(quote.submittedAt)}</span>
                        {quote.newPrice && (
                          <span className="font-medium text-zinc-950 tabular-nums">
                            {String(quote.newPrice)} SAR
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Invites Section */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <h3 className="flex items-center gap-2 font-semibold text-zinc-950">
                <History className="h-4 w-4 text-zinc-500" />
                Requirement Invites ({invites.length})
              </h3>
            </div>
            <div className="max-h-[400px] flex-1 overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200/80 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent">
              {invites.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center p-6 text-sm text-zinc-500">
                  No invites sent yet.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {invites.map((invite) => (
                    <li key={invite.id} className="p-4 transition-colors hover:bg-zinc-50">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/requirements/${invite.requirementId}`}
                            className="hover:text-brand-blue text-sm font-medium text-zinc-900 transition-colors"
                          >
                            {invite.requirementProject}
                          </Link>
                          <p className="mt-1 font-mono text-xs text-zinc-500">
                            {invite.requirementRef || "Draft Ref"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            invite.emailStatus === "SENT"
                              ? "bg-green-50 text-green-700"
                              : invite.emailStatus === "FAILED"
                                ? "bg-red-50 text-red-700"
                                : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {invite.emailStatus}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                        <Mail className="h-3.5 w-3.5" />
                        Emailed: {formatDateOnly(invite.emailedAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (static shell + streamed data)                                */
/* ------------------------------------------------------------------ */

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<VendorDetailSkeleton />}>
      <VendorData id={id} />
    </Suspense>
  );
}
