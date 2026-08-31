"use client";

import { cn } from "@lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuCircleAlert as AlertCircle, LuInfo as Info, LuX as X } from "react-icons/lu";

import { ENQUIRE_STEPS, type EnquireStep } from "@/lib/enquire-constants";
import {
  enquireEyebrowClass,
  enquirePageTitleClass,
} from "@/sections/enquire/enquire-typography";
import { useEnquire } from "@/sections/enquire/EnquireContext";
import { StepTrain } from "@/sections/enquire/StepTrain";

type Props = {
  step: EnquireStep | "done" | "verify";
  title: string;
  subtitle?: string;
  details?: React.ReactNode;
  children: React.ReactNode;
};

export function EnquireShell({ step, title, subtitle, details, children }: Props) {
  const router = useRouter();
  const { unlockedThrough, error, saving, registration } = useEnquire();
  const [showInfo, setShowInfo] = useState(false);

  // Warm adjacent step routes so Next feels instant.
  useEffect(() => {
    const i = ENQUIRE_STEPS.indexOf(step);
    if (i < 0) return;
    if (i + 1 < ENQUIRE_STEPS.length) router.prefetch(`/enquire/${ENQUIRE_STEPS[i + 1]}`);
    if (i > 0) router.prefetch(`/enquire/${ENQUIRE_STEPS[i - 1]}`);
  }, [router, step]);

  if (step === "verify" || step === "done") {
    return (
      <div className="font-enquire relative flex h-screen flex-col overflow-hidden bg-white text-base antialiased">
        {step === "done" && (
          <header className="absolute top-0 left-0 z-50 flex w-full items-center justify-center p-6 md:justify-start md:p-12">
            <img src="/images/logo/logo.webp" alt="RVCC Logo" className="h-8 w-auto md:h-10" />
          </header>
        )}
        <span aria-live="polite" className="sr-only">
          {saving ? "Saving your progress" : ""}
        </span>
        <main
          className={cn(
            "relative z-10 flex flex-1",
            step === "done" && "items-center justify-center p-6"
          )}
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="font-enquire relative flex min-h-screen flex-col bg-white text-base text-zinc-950 antialiased md:flex-row md:text-[17px]">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="bg-brand-blue/5 absolute -top-32 -right-32 h-96 w-96 rounded-full blur-[100px]" />
        <div className="bg-brand-blue/[0.03] absolute bottom-0 left-0 h-72 w-72 rounded-full blur-[80px]" />
      </div>

      <aside className="bg-brand-blue border-brand-blue/20 relative z-40 flex w-full shrink-0 flex-col overflow-hidden border text-white shadow-2xl md:fixed md:m-4 md:h-[calc(100vh-32px)] md:w-80 md:rounded-[2.5rem] lg:w-96">
        <div className="flex shrink-0 items-center gap-4 border-b border-white/10 px-6 py-8">
          <img
            src="/images/logo/logo.webp"
            alt="RVCC Logo"
            className="h-8 w-auto brightness-0 invert sm:h-10"
          />
          <div className="hidden h-6 w-px bg-white/30 sm:block"></div>
          <span
            className={cn(enquireEyebrowClass, "mb-0 hidden leading-none text-white/90 sm:block")}
          >
            Prospective Supplier Registration
          </span>
        </div>

        {Boolean(registration?.email) && (
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <StepTrain
              current={step}
              unlockedThrough={unlockedThrough}
              emailVerified={Boolean(registration?.email)}
            />
          </div>
        )}
      </aside>

      <main className="relative z-10 flex h-screen w-full flex-1 flex-col items-center overflow-hidden px-6 pt-10 pb-4 md:ml-[352px] md:px-12 md:pt-12 md:pb-6 lg:ml-[416px] lg:px-20">
        <div className="flex h-full w-full max-w-4xl flex-col">
          <div className="mb-8 flex shrink-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-3">
              <h1 className={enquirePageTitleClass}>{title}</h1>
            </div>
            <div
              id="enquire-header-actions"
              className="flex shrink-0 items-center gap-3 empty:hidden"
            ></div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex shrink-0 items-start gap-3 border-l-4 border-red-500 bg-red-50 px-4 py-3.5 text-base leading-relaxed font-medium text-red-800"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <span aria-live="polite" className="sr-only">
            {saving ? "Saving your progress" : ""}
          </span>

          <div className="-mx-2 flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-0">
            {children}
          </div>
        </div>
      </main>

      {/* Floating Info Button & Popover */}
      {(subtitle || details) && (
        <div
          className="fixed right-6 bottom-6 z-50 flex flex-col items-end"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        >
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="mb-4 w-[280px] rounded-2xl bg-white p-5 font-sans shadow-2xl ring-1 ring-zinc-200 sm:w-[360px]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="font-sans text-xs font-bold tracking-[0.1em] text-zinc-500 uppercase">
                      Instructions
                    </div>
                    {subtitle && (
                      <p className="text-brand-blue text-[13px] leading-relaxed font-medium">
                        {subtitle}
                      </p>
                    )}
                    {details && (
                      <p className="text-[13px] leading-relaxed text-zinc-600">{details}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="shrink-0 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 md:hidden"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full shadow-xl ring-4 ring-white transition-all duration-300",
              showInfo
                ? "scale-105 bg-zinc-900 text-white"
                : "bg-brand-blue text-white hover:scale-105 active:scale-95"
            )}
            title="Help & Information"
            aria-expanded={showInfo}
          >
            {showInfo ? <X className="h-5 w-5" /> : <Info className="h-6 w-6" />}
          </button>
        </div>
      )}
    </div>
  );
}
