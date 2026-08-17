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
            Approved suppliers use email and password. New suppliers{" "}
            <a href="/register/verify" className="text-brand-blue underline underline-offset-2">
              register here
            </a>{" "}
            — after email verification we open the portal if you already have an account, or the
            registration form if you do not.
          </p>
        </div>
        <Suspense fallback={<LoginFormSkeleton />}>
          <VendorLoginForm />
        </Suspense>
      </div>
    </main>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="h-[68px] animate-pulse rounded-md bg-zinc-100" />
      <div className="h-[68px] animate-pulse rounded-md bg-zinc-100" />
      <div className="h-14 animate-pulse rounded-md bg-zinc-100" />
    </div>
  );
}
