import { Suspense } from "react";

import { VendorLoginForm } from "@/sections/VendorLoginForm";

export default function VendorLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-brand-blue text-xs font-bold tracking-[0.24em] uppercase">
            RVCC Supplier Portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Sign in</h1>
          <p className="mt-1.5 text-sm text-zinc-600">
            Approved suppliers only. Not registered yet?{" "}
            <a href="/enquire" className="text-brand-blue underline underline-offset-2">
              Start an E-Vendor Registration
            </a>
            .
          </p>
        </div>
        {/*
          The form reads ?next= via useSearchParams(), which forces a client
          bailout. Without this boundary the static prerender of this page
          fails the production build.
        */}
        <Suspense fallback={<LoginFormSkeleton />}>
          <VendorLoginForm />
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
