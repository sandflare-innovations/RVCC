import { Suspense } from "react";

import { ShoppingBag, Store } from "lucide-react";

import { VendorLoginForm } from "@/sections/VendorLoginForm";

export default function VendorLoginPage() {
  return (
    <main className="flex min-h-screen bg-white">
      {/* Left side - Branding/Hero (hidden on mobile) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-12 lg:flex lg:w-1/2">
        {/* Background Decorative Elements */}
        <div className="pointer-events-none absolute top-0 left-0 h-full w-full">
          <div className="bg-brand-blue/10 absolute top-0 right-0 h-[800px] w-[800px] translate-x-1/3 -translate-y-1/3 rounded-full blur-[100px]"></div>
          <div className="bg-brand-blue/20 absolute bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/4 translate-y-1/4 rounded-full blur-[80px]"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10">
          <div className="mb-16 flex items-center gap-3 text-white">
            <div className="bg-brand-blue shadow-brand-blue/20 rounded-lg p-2 shadow-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-bold tracking-[0.2em] uppercase">
              RVCC Supplier Portal
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="mb-4 text-4xl leading-tight font-bold text-white tracking-tight">Supplier Portal</h1>
            <p className="mb-10 text-lg leading-relaxed text-zinc-400 font-light">
              Manage your profile, respond to requirements, and track your business relationships with RVCC.
            </p>

            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-zinc-300 backdrop-blur-sm border border-white/5">
              <ShoppingBag className="h-4 w-4 text-brand-blue" />
              <span>Approved Suppliers Only</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-zinc-600">
          &copy; {new Date().getFullYear()} RVCC. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="relative flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32">
        {/* Mobile Header (only visible on small screens) */}
        <div className="mb-12 flex items-center justify-center gap-2 text-zinc-950 lg:hidden">
          <Store className="text-brand-blue h-6 w-6" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase">RVCC Supplier Portal</span>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Sign In
            </h2>
            <p className="text-sm text-zinc-500">
              Enter your credentials to access your supplier account.
            </p>
          </div>

          <Suspense fallback={<LoginFormSkeleton />}>
            <VendorLoginForm />
          </Suspense>
        </div>
      </div>
    </main>
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
        <div className="h-12 w-full animate-pulse rounded-lg bg-zinc-900" />
      </div>
    </div>
  );
}
