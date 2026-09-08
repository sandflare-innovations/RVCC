import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  History,
  KeyRound,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Unlock,
  Users,
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

function formatDateTime(d: string | null | undefined) {
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

function formatDateOnly(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrencySar(val: string | number | null | undefined) {
  if (!val) return null;
  const num = Number(val);
  if (isNaN(num)) return `${val} SAR`;
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} SAR`;
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
/*  Skeleton Fallback                                                 */
/* ------------------------------------------------------------------ */

function VendorDetailSkeleton() {
  return (
    <div className="h-full overflow-y-auto bg-zinc-50/40 p-6 sm:p-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 pb-20">
        <Skeleton className="h-9 w-36 rounded-full" />

        {/* Header skeleton */}
        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-zinc-100/80 bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] md:flex-row md:items-center">
          <div className="flex items-center gap-6">
            <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-56 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded-md" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* 4 Dashboard Metric Cards Skeleton */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative flex h-full min-h-[110px] flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-8 w-8 rounded-2xl" />
              </div>
              <Skeleton className="mt-3 h-7 w-28 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Middle Section Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] lg:col-span-2">
            <Skeleton className="mb-6 h-6 w-48 rounded-lg" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
            <Skeleton className="mb-6 h-6 w-40 rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Lists Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]"
            >
              <Skeleton className="mb-5 h-6 w-36 rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Async Data Component (Streamed via Suspense)                      */
/* ------------------------------------------------------------------ */

async function VendorData({ id }: { id: string }) {
  const result = await adminSessionJson<Payload>(`/vendors/${encodeURIComponent(id)}`);

  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <div className="p-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 text-lg font-bold text-zinc-900">Could not load vendor profile</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Received status code {result.status}. Please check your connection and try again.
          </p>
          <div className="mt-6">
            <BackButton label="Return to vendor directory" />
          </div>
        </div>
      </div>
    );
  }

  const raw = result.data as any;
  const vendor: Payload["vendor"] = raw?.vendor || raw;
  const quotes: Payload["quotes"] = raw?.quotes || [];
  const invites: Payload["invites"] = raw?.invites || [];

  if (!vendor || !vendor.id) notFound();

  const isLocked = Boolean(vendor.lockedUntil && new Date(vendor.lockedUntil) > new Date());
  const isBlocked = vendor.isActive === false || vendor.portalAccess === "HELD";

  // Calculate quote sum SAR
  const totalQuoteSar = quotes.reduce((acc, q) => {
    const val = Number(q.newPrice);
    return !isNaN(val) && val > 0 ? acc + val : acc;
  }, 0);

  return (
    <div className="h-full overflow-y-auto bg-zinc-50/40 p-6 sm:p-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 pb-24">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <BackButton label="Back to vendors" />
          <span className="hidden items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3.5 py-1 text-xs font-semibold text-zinc-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:inline-flex">
            <Building2 className="h-3.5 w-3.5 text-brand-blue" />
            Vendor Profile #{vendor.referenceNumber || vendor.id.slice(0, 8)}
          </span>
        </div>

        {/* Hero Header Profile Card */}
        <div className="group relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] transition-all sm:p-8 md:flex-row md:items-center">
          {/* Subtle Ambient Glows */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />
          <div className="pointer-events-none absolute -top-12 right-0 h-96 w-96 rounded-full bg-brand-blue/5 blur-3xl" />

          {/* Left: Avatar & Identity */}
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-brand-blue/20 bg-gradient-to-br from-brand-blue/15 via-brand-blue/5 to-white shadow-inner sm:h-24 sm:w-24">
              <span className="text-2xl font-bold tracking-wider text-brand-blue sm:text-3xl">
                {getInitials(vendor.name, vendor.email)}
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                  {vendor.name || vendor.companyName || "Unnamed Vendor"}
                </h1>
                {vendor.companyName && vendor.name && vendor.companyName !== vendor.name && (
                  <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-600">
                    {vendor.companyName}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-500">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <span className="select-all">{vendor.email}</span>
                </div>
                {vendor.referenceNumber && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
                    <span>Ref:</span>
                    <span className="font-semibold text-zinc-700">{vendor.referenceNumber}</span>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <StatusBadge status={vendor.isActive ? "ACTIVE" : "DISABLED"} />
                <StatusBadge status={vendor.portalAccess === "RELEASED" ? "RELEASED" : "HELD"} />
                {vendor.mustChangePassword && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                    <KeyRound className="h-3.5 w-3.5" />
                    Reset required
                  </span>
                )}
                {isLocked && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-600/20 ring-inset">
                    <Lock className="h-3.5 w-3.5" />
                    Locked out
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="relative z-10 shrink-0 border-t border-zinc-100 pt-4 md:border-t-0 md:pt-0">
            <VendorProfileActions
              vendor={{
                id: vendor.id,
                email: vendor.email,
                name: vendor.name,
                companyName: vendor.companyName,
                isActive: vendor.isActive,
                portalAccess: vendor.portalAccess as "HELD" | "RELEASED",
              }}
            />
          </div>
        </div>

        {/* 4 Dashboard Metric Cards Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1: Portal Access */}
          <div className="relative flex h-full min-h-[115px] flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                Portal Access
              </p>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                  vendor.portalAccess === "RELEASED"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {vendor.portalAccess === "RELEASED" ? (
                  <Unlock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
            </div>
            <div className="relative z-10 mt-3 flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                {vendor.portalAccess === "RELEASED" ? "Released" : "Held"}
              </p>
              <span className="text-xs font-medium text-zinc-500">
                {vendor.portalAccess === "RELEASED" ? "Portal Live" : "Sign-in Blocked"}
              </span>
            </div>
          </div>

          {/* Card 2: Account Health */}
          <div className="relative flex h-full min-h-[115px] flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                Account Health
              </p>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                  vendor.isActive ? "bg-brand-blue/10 text-brand-blue" : "bg-red-50 text-red-600"
                }`}
              >
                {vendor.isActive ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <ShieldAlert className="h-4 w-4" />
                )}
              </div>
            </div>
            <div className="relative z-10 mt-3 flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                {vendor.isActive ? "Active" : "Deactivated"}
              </p>
              <span className="text-xs font-medium text-zinc-500">
                {isLocked ? "Lockout active" : `${vendor.activeSessions} session(s)`}
              </span>
            </div>
          </div>

          {/* Card 3: Quotes Submitted */}
          <div className="relative flex h-full min-h-[115px] flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                Submitted Quotes
              </p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="relative z-10 mt-3 flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold tracking-tight text-zinc-950 tabular-nums sm:text-2xl">
                {quotes.length}
              </p>
              <span className="text-xs font-medium text-zinc-500 truncate">
                {totalQuoteSar > 0 ? `${totalQuoteSar.toLocaleString()} SAR` : "No price sum"}
              </span>
            </div>
          </div>

          {/* Card 4: RFQ Invitations */}
          <div className="relative flex h-full min-h-[115px] flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                RFQ Invitations
              </p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                <History className="h-4 w-4" />
              </div>
            </div>
            <div className="relative z-10 mt-3 flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold tracking-tight text-zinc-950 tabular-nums sm:text-2xl">
                {invites.length}
              </p>
              <span className="text-xs font-medium text-zinc-500">
                {invites.length > 0
                  ? `${invites.filter((i) => i.emailStatus === "SENT").length} emailed`
                  : "None received"}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Registration Info + Security & Access */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Registration Profile Card (Spans 2 columns) */}
          <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-100/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] lg:col-span-2">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100/80 bg-zinc-50/50 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-zinc-950">Supplier Registration</h3>
                </div>
                {vendor.registration && (
                  <StatusBadge status={vendor.registrationStatus || "DRAFT"} />
                )}
              </div>

              <div className="p-6">
                {vendor.registration ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-colors hover:border-zinc-200">
                        <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                          Company Legal Name
                        </p>
                        <p className="mt-1 text-base font-semibold text-zinc-950">
                          {vendor.companyName || "Not provided"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-colors hover:border-zinc-200">
                        <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                          Application Reference
                        </p>
                        <p className="mt-1 font-mono text-base font-semibold text-zinc-950">
                          {vendor.referenceNumber || "Draft Ref"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/30 p-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        {vendor.registrationComplete ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-zinc-900">
                              Application officially completed & verified
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="font-medium text-zinc-700">
                              Registration application is incomplete / in review
                            </span>
                          </>
                        )}
                      </div>

                      <Link
                        href={`/registrations/${vendor.registrationId}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-blue/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                      >
                        <span>Open Application</span>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 shadow-inner">
                      <FileText className="h-7 w-7" />
                    </div>
                    <h4 className="mt-3 text-base font-semibold text-zinc-950">
                      Direct Account (No Application Linked)
                    </h4>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
                      This vendor account was created directly by an administrator or through legacy
                      import and does not have an attached supplier registration portal dossier.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security & Access Timeline Card */}
          <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-100/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100/80 bg-zinc-50/50 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-zinc-950">Security & Sessions</h3>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/40 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="h-4 w-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-600">Created On</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900">
                    {formatDateOnly(vendor.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/40 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-600">Last Sign-in</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900">
                    {formatDateTime(vendor.lastLoginAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/40 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-600">Active Sessions</span>
                  </div>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-200/70 px-2 text-xs font-bold text-zinc-900">
                    {vendor.activeSessions}
                  </span>
                </div>

                {isLocked ? (
                  <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-xs text-red-900">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div>
                      <p className="font-semibold">Temporary Security Lockout</p>
                      <p className="mt-0.5 leading-relaxed text-red-700">
                        Account locked until {formatDateTime(vendor.lockedUntil)}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>No active security lockouts on this account.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Quotes & Invites List Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Quotes Card */}
          <div className="flex flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between border-b border-zinc-100/80 bg-zinc-50/50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-brand-blue">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-zinc-950">Submitted Quotes</h3>
              </div>
              <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-zinc-700 shadow-sm">
                {quotes.length}
              </span>
            </div>

            <div className="max-h-[440px] flex-1 overflow-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200/80 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent">
              {quotes.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-zinc-950">No quotes submitted</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    This vendor hasn't participated in any RFQ bidding yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="group rounded-2xl bg-white p-4 ring-1 ring-zinc-100 transition-all ring-inset hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.25)] hover:ring-brand-blue/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/requirements/${quote.requirementId}`}
                            className="text-sm font-bold text-zinc-950 transition-colors hover:text-brand-blue"
                          >
                            {quote.requirementProject}
                          </Link>
                          <p className="mt-0.5 font-mono text-xs text-zinc-500">
                            {quote.requirementRef || "Draft Requirement"}
                          </p>
                        </div>
                        <StatusBadge status={quote.status} />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                          {formatDateOnly(quote.submittedAt)}
                        </span>
                        {quote.newPrice ? (
                          <span className="font-semibold text-zinc-950 tabular-nums">
                            {formatCurrencySar(quote.newPrice)}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Invites Card */}
          <div className="flex flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between border-b border-zinc-100/80 bg-zinc-50/50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <History className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-zinc-950">Requirement Invitations</h3>
              </div>
              <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-zinc-700 shadow-sm">
                {invites.length}
              </span>
            </div>

            <div className="max-h-[440px] flex-1 overflow-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200/80 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent">
              {invites.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                    <History className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-zinc-950">No invitations found</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    This vendor has not received RFQ invites directly.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="group rounded-2xl bg-white p-4 ring-1 ring-zinc-100 transition-all ring-inset hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.25)] hover:ring-brand-blue/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/requirements/${invite.requirementId}`}
                            className="text-sm font-bold text-zinc-950 transition-colors hover:text-brand-blue"
                          >
                            {invite.requirementProject}
                          </Link>
                          <p className="mt-0.5 font-mono text-xs text-zinc-500">
                            {invite.requirementRef || "Draft Requirement"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                            invite.emailStatus === "SENT"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 ring-inset"
                              : invite.emailStatus === "FAILED"
                                ? "bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset"
                                : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-500/20 ring-inset"
                          }`}
                        >
                          {invite.emailStatus}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-zinc-400" />
                          Emailed: {formatDateOnly(invite.emailedAt)}
                        </span>
                        <span className="text-zinc-400">Direct Invite</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Root                                                         */
/* ------------------------------------------------------------------ */

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<VendorDetailSkeleton />}>
      <VendorData id={id} />
    </Suspense>
  );
}
