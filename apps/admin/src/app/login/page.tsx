import { Suspense } from "react";

import type { Metadata } from "next";

import { AdminLoginForm } from "@/sections/AdminLoginForm";

export const metadata: Metadata = {
  title: "Sign in | RVCC Admin",
  // Keep the admin surface out of search results.
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="font-enquire flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 antialiased">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-brand-blue text-xs font-bold tracking-[0.24em] uppercase">
            RVCC Administration
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Sign in</h1>
          <p className="mt-1.5 text-sm text-zinc-600">
            Staff access only. Vendor registration is on the public marketing site.
          </p>
        </div>
        {/*
          The form reads ?next= via useSearchParams(), which forces a client
          bailout. Without this boundary the static prerender of this page
          fails the production build.
        */}
        <Suspense fallback={<LoginFormSkeleton />}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}

/** Matches the form's height so the shell does not jump when it hydrates. */
function LoginFormSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="h-[68px] animate-pulse rounded-md bg-zinc-100" />
      <div className="h-[68px] animate-pulse rounded-md bg-zinc-100" />
      <div className="h-14 animate-pulse rounded-md bg-zinc-100" />
    </div>
  );
}
