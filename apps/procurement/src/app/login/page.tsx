import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { ProcurementLoginForm } from "@/sections/ProcurementLoginForm";

export const metadata: Metadata = {
  title: "Sign in | RVCC Procurement",
  robots: { index: false, follow: false },
};

export default function ProcurementLoginPage() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-white md:flex-row md:p-4 gap-4">
      {/* Left Panel — Branding (hidden on mobile) */}
      <div className="relative hidden w-full flex-col justify-between overflow-hidden rounded-[2rem] bg-zinc-950 p-12 md:flex md:w-5/12 lg:w-3/7 xl:p-16">
        {/* Background image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-bg.webp')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/images/logo/logo.webp"
            alt="RVCC"
            width={120}
            height={42}
            className="h-10 w-auto brightness-0 invert"
          />
        </div>

        {/* Brand narrative */}
        <div className="relative z-10 max-w-lg space-y-4">
          <div className="space-y-2">
            <p className="text-[#0073bc] w-fit rounded-md bg-white px-3 py-1 text-xs font-black tracking-[0.2em] uppercase shadow-xs">
              Procurement & Sourcing
            </p>
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-white uppercase xl:text-5xl">
              Material Requisitions & Sourcing Lifecycle
            </h1>
          </div>
          <p className="text-base leading-relaxed font-normal text-zinc-300">
            Access the RVCC internal procurement platform to track requisitions, manage purchase orders, and coordinate project material delivery.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} RVCC. Enterprise Procurement System.
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="relative flex w-full flex-1 flex-col justify-center bg-white px-6 py-12 md:w-7/12 lg:w-4/7 lg:px-16 xl:px-24">
        {/* Mobile Header */}
        <div className="mb-8 flex items-center justify-between md:hidden">
          <Image
            src="/images/logo/logo.webp"
            alt="RVCC"
            width={100}
            height={36}
            className="h-8 w-auto"
          />
          <span className="text-xs font-bold uppercase tracking-wider text-[#0073bc]">
            Procurement
          </span>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0073bc] border-t-transparent" />
            </div>
          }
        >
          <ProcurementLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
