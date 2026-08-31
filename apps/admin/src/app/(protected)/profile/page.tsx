import { Mail, Shield, User } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getAdminFromSession } from "@/lib/session";

import { SecurityCard } from "./SecurityCard";
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
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-8 pb-12">
          {/* Hero skeleton */}
          <div className="relative min-h-[280px] overflow-hidden rounded-[2.5rem] bg-zinc-200 p-8 md:p-12">
            <Skeleton className="absolute top-6 right-6 h-11 w-32 rounded-2xl bg-zinc-300/50" />
            <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-300/30 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center">
              <Skeleton className="h-28 w-28 rounded-2xl bg-zinc-300/50" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-9 w-56 bg-zinc-300/50" />
                <Skeleton className="h-5 w-48 bg-zinc-300/50" />
                <div className="mt-4 flex gap-3">
                  <Skeleton className="h-7 w-28 rounded-full bg-zinc-300/50" />
                  <Skeleton className="h-7 w-24 rounded-full bg-zinc-300/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Info cards skeleton */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <Skeleton className="mb-5 h-5 w-36" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <Skeleton className="mb-5 h-5 w-32" />
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
    <div className="flex items-center justify-between border-b border-zinc-100 py-2.5 first:pt-0 last:border-0 last:pb-0">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span
        className={`text-sm font-medium text-zinc-900 ${mono ? "rounded bg-zinc-50 px-2 py-0.5 font-mono text-xs" : ""}`}
      >
        {value}
      </span>
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
  const accessLevel =
    admin.role === "SUPER_ADMIN"
      ? "Full Access"
      : admin.role === "ADMIN"
        ? "Standard Access"
        : "Limited Access";

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="animate-in fade-in space-y-8 pb-12 duration-500">
          {/* ---- Hero Banner ---- */}
          <section className="bg-brand-blue relative min-h-[280px] overflow-hidden rounded-[2.5rem] p-8 shadow-sm md:p-12">
            {/* Decorative Background */}
            <div className="pointer-events-none absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-white opacity-5 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-blue-400 opacity-10 blur-3xl" />

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="profile-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M0 40L40 0H20L0 20M40 40V20L20 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#profile-pattern)">
                <animate attributeName="x" from="0" to="-40" dur="2s" repeatCount="indefinite" />
                <animate attributeName="y" from="0" to="40" dur="2s" repeatCount="indefinite" />
              </rect>
            </svg>

            {/* Sign Out Button — top right */}
            <div className="absolute top-6 right-6 z-20 md:top-8 md:right-8">
              <SignOutButton />
            </div>

            <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center">
              {/* Avatar */}
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 shadow-xl backdrop-blur-sm">
                <span className="text-4xl font-bold tracking-wider text-white">{initials}</span>
              </div>

              {/* Info */}
              <div className="flex-1 text-white">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{displayName}</h1>
                <div className="mt-2 flex items-center gap-2 text-blue-100/90">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium">{admin.email}</span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                    <Shield className="h-3.5 w-3.5" />
                    {roleLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur-sm">
                    {accessLevel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Active Session
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ---- Cards Grid ---- */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Account Details */}
            <div className="group hover:border-brand-blue/20 relative rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] transition-all duration-300">
              <div className="via-brand-blue/25 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
              <div className="mb-5 flex items-center gap-3">
                <div className="bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 group-hover:text-white">
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

            {/* Security Card (client — has reset password button + modal) */}
            <SecurityCard />
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
    <div className="flex h-full min-h-0 w-full flex-col">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileData />
      </Suspense>
    </div>
  );
}
