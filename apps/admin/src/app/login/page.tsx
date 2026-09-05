import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ADMIN_HOME_PATH } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { AdminLoginForm } from "@/sections/auth/AdminLoginForm";

export const metadata: Metadata = {
  title: "Sign in | RVCC Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const admin = await getAdminFromSession();
  if (admin) {
    redirect(ADMIN_HOME_PATH);
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col gap-4 bg-white md:flex-row md:p-4">
      {/* Left Panel — Branding (hidden on mobile) */}
      <div className="relative hidden w-full flex-col justify-between overflow-hidden rounded-[2rem] bg-zinc-950 p-12 md:flex md:w-5/12 lg:w-3/7 xl:p-16">
        {/* Background image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-bg.webp')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <img
            src="/images/logo/logo.webp"
            alt="RVCC"
            className="h-10 w-auto brightness-0 invert"
          />
        </div>

        {/* Copy */}
        <div className="relative z-10 max-w-lg space-y-4">
          <div className="space-y-1">
            <p className="text-brand-blue mb-4 w-fit rounded-sm bg-white px-3 py-1 text-xs font-black tracking-[0.2em] uppercase shadow-sm">
              Administration
            </p>
            <h1 className="font-heading text-6xl leading-[0.6] tracking-tight text-white uppercase xl:text-8xl">
              Manage Procurement Excellence
            </h1>
          </div>
          <p className="text-xl leading-relaxed font-medium text-zinc-200">
            Access the RVCC administration portal to evaluate vendors, manage requirements, and
            oversee the procurement lifecycle securely.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} RVCC. All rights reserved.
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="relative flex w-full flex-1 flex-col justify-center bg-white px-6 py-12 md:w-7/12 lg:w-4/7 lg:px-16 xl:px-24">
        {/* Mobile Header */}
        <div className="absolute top-8 left-6 md:hidden">
          <img src="/images/logo/logo.webp" alt="RVCC" className="h-8 w-auto" />
        </div>

        <div className="mx-auto w-full max-w-md pt-16 md:pt-0">
          <div className="mb-10 space-y-3 text-center">
            <h2 className="font-heading text-brand-blue text-5xl tracking-tight uppercase md:text-6xl">
              Sign In
            </h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              Enter your credentials to access the administration portal.
            </p>
          </div>

          <Suspense fallback={<LoginFormSkeleton />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="w-full space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-zinc-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-zinc-100" />
      </div>
      <div className="pt-2">
        <div className="bg-brand-blue/20 h-12 w-full animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
