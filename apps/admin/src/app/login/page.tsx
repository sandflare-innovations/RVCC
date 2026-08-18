import { Suspense } from "react";

import { Briefcase, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { enquireVerifyUrl } from "@/lib/public-urls";
import { AdminLoginForm } from "@/sections/AdminLoginForm";

export const metadata: Metadata = {
  title: "Sign in | RVCC Admin",
  // Keep the admin surface out of search results.
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  const enquireHref = enquireVerifyUrl();

  return (
    <main className="font-enquire flex min-h-screen bg-white">
      {/* Left side - Branding/Hero (hidden on mobile) */}
      <div className="bg-brand-blue relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-1/2">
        {/* Background Decorative Elements */}
        <div className="pointer-events-none absolute top-0 left-0 h-full w-full opacity-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute right-0 bottom-0 h-[500px] w-[500px] translate-x-1/3 translate-y-1/3 rounded-full bg-[#004f82] blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="mb-16 flex items-center gap-3 text-white">
            <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-bold tracking-[0.2em] uppercase">
              RVCC Administration
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="mb-6 text-4xl leading-tight font-bold text-white">
              Manage Procurement Excellence
            </h1>
            <p className="text-brand-blue-50 mb-10 text-lg leading-relaxed text-white/80">
              Access the RVCC administration portal to evaluate vendors, manage requirements, and
              oversee the procurement lifecycle securely.
            </p>

            <div className="flex items-center gap-4 text-sm font-medium text-white/60">
              <Briefcase className="h-5 w-5" />
              <span>Internal Staff Access Only</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/50">
          &copy; {new Date().getFullYear()} RVCC. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="relative flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32">
        {/* Mobile Header (only visible on small screens) */}
        <div className="text-brand-blue mb-12 flex items-center gap-2 lg:hidden">
          <ShieldCheck className="h-6 w-6" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase">RVCC Administration</span>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="mb-3 text-3xl font-semibold tracking-tight text-zinc-950">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-500">
              Staff access only. Vendors should register at the{" "}
              <a
                href={enquireHref}
                className="text-brand-blue font-medium underline-offset-2 transition-all hover:underline"
                rel="noopener noreferrer"
              >
                E-Vendor Portal
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
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

/** Matches the form's height so the shell does not jump when it hydrates. */
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
