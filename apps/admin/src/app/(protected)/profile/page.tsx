import { Suspense } from "react";
import { getAdminFromSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SignOutCard } from "./SignOutCard";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Skeleton fallbacks                                                  */
/* ------------------------------------------------------------------ */

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Static header */}
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Profile card skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* Sign out card skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-32 mb-3" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-24 mt-4 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Async data component (streamed via Suspense)                       */
/* ------------------------------------------------------------------ */

async function ProfileData() {
  const admin = await getAdminFromSession();
  if (!admin) redirect("/login");

  return (
    <>
      {/* Static header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Admin Profile</h1>
        <p className="mt-1 text-sm text-zinc-600">Manage your administrative account.</p>
      </div>
      
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10 text-2xl font-bold text-brand-blue">
            {(admin.name || admin.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">{admin.name || "Administrator"}</h2>
            <p className="text-sm text-zinc-500">{admin.email}</p>
            <p className="mt-1 inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
              Role: {admin.role.replace("_", " ").toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SignOutCard />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (static shell + streamed data)                                */
/* ------------------------------------------------------------------ */

export default async function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileData />
      </Suspense>
    </div>
  );
}
