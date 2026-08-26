import { Suspense } from "react";
import { getAdminFromSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Shield, Mail, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function formatRole(role: string): string {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ------------------------------------------------------------------ */
/*  Skeleton fallbacks                                                  */
/* ------------------------------------------------------------------ */

function ProfileSkeleton() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full">
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="space-y-8 pb-12">
          {/* Hero skeleton */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-200 p-8 md:p-12 min-h-[280px]">
            <Skeleton className="absolute top-6 right-6 h-11 w-32 rounded-2xl bg-zinc-300/50" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-300/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
              <Skeleton className="h-28 w-28 rounded-2xl bg-zinc-300/50" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-9 w-56 bg-zinc-300/50" />
                <Skeleton className="h-5 w-48 bg-zinc-300/50" />
                <div className="flex gap-3 mt-4">
                  <Skeleton className="h-7 w-28 rounded-full bg-zinc-300/50" />
                  <Skeleton className="h-7 w-24 rounded-full bg-zinc-300/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Info cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <Skeleton className="h-5 w-36 mb-5" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <Skeleton className="h-5 w-32 mb-5" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Info row                                                           */
/* ------------------------------------------------------------------ */

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0 last:pb-0 first:pt-0">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span className={`text-sm font-medium text-zinc-900 ${mono ? "font-mono text-xs bg-zinc-50 px-2 py-0.5 rounded" : ""}`}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Async data component (streamed via Suspense)                       */
/* ------------------------------------------------------------------ */

async function ProfileData() {
  const admin = await getAdminFromSession();
  if (!admin) redirect("/login");

  const initials = getInitials(admin.name, admin.email);
  const displayName = admin.name || "Administrator";
  const roleLabel = formatRole(admin.role);
  const accessLevel = admin.role === "SUPER_ADMIN" ? "Full Access" : admin.role === "ADMIN" ? "Standard Access" : "Limited Access";

  return (
    <div className="flex flex-col min-h-0 w-full h-full">
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="animate-in fade-in duration-500 space-y-8 pb-12">
          {/* ---- Hero Banner ---- */}
          <section className="relative overflow-hidden rounded-[2.5rem] bg-brand-blue p-8 md:p-12 min-h-[280px] shadow-sm">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white opacity-5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400 opacity-10 blur-3xl pointer-events-none" />

            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="profile-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#profile-pattern)">
                <animate attributeName="x" from="0" to="-40" dur="2s" repeatCount="indefinite" />
                <animate attributeName="y" from="0" to="40" dur="2s" repeatCount="indefinite" />
              </rect>
            </svg>

            {/* Sign Out Button — top right */}
            <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20">
              <SignOutButton />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
              {/* Avatar */}
              <div className="h-28 w-28 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm shadow-xl">
                <span className="text-4xl font-bold text-white tracking-wider">{initials}</span>
              </div>

              {/* Info */}
              <div className="flex-1 text-white">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{displayName}</h1>
                <div className="mt-2 flex items-center gap-2 text-blue-100/90">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">{admin.email}</span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                    <Shield className="w-3.5 h-3.5" />
                    {roleLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur-sm">
                    {accessLevel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 px-3.5 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    Active Session
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ---- Cards Grid ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Details */}
            <div className="group relative rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] hover:border-brand-blue/20 transition-all duration-300">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Account Details</h2>
                  <p className="text-xs text-zinc-500">Your admin profile information</p>
                </div>
              </div>
              <div className="space-y-0">
                <InfoRow label="Full Name" value={displayName} />
                <InfoRow label="Email Address" value={admin.email} />
                <InfoRow label="Role" value={roleLabel} />
                <InfoRow label="Access Level" value={accessLevel} />
                <InfoRow label="User ID" value={admin.id} mono />
              </div>
            </div>

            {/* Security Card */}
            <div className="group relative rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] hover:border-brand-blue/20 transition-all duration-300">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Security</h2>
                  <p className="text-xs text-zinc-500">Session & access status</p>
                </div>
              </div>
              <div className="space-y-0">
                <InfoRow
                  label="Session Status"
                  value="Active"
                />
                <InfoRow label="Validation" value="Per-request" />
                <InfoRow label="Cookie Type" value="httpOnly" mono />
              </div>
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

export default async function ProfilePage() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileData />
      </Suspense>
    </div>
  );
}
