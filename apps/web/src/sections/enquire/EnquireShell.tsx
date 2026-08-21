"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { ENQUIRE_STEPS, type EnquireStep } from "@/lib/enquire-constants";
import { useEnquire } from "@/sections/enquire/EnquireContext";
import { StepTrain } from "@/sections/enquire/StepTrain";
import {
  enquireEyebrowClass,
  enquirePageSubtitleClass,
  enquirePageTitleClass,
} from "@/sections/enquire/enquire-typography";
import { cn } from "@lib/utils";

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
      <div className="font-enquire relative h-screen overflow-hidden bg-white text-base antialiased flex flex-col">
        {step === "done" && (
          <header className="absolute top-0 left-0 w-full p-6 md:p-12 flex items-center justify-center md:justify-start z-50">
            <img src="/images/logo/logo.webp" alt="RVCC Logo" className="h-8 md:h-10 w-auto" />
          </header>
        )}
        <span aria-live="polite" className="sr-only">
          {saving ? "Saving your progress" : ""}
        </span>
        <main className={cn("relative z-10 flex-1 flex", step === "done" && "items-center justify-center p-6")}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="font-enquire relative min-h-screen bg-white text-base text-zinc-950 antialiased md:text-[17px] flex flex-col md:flex-row">
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="bg-brand-blue/5 absolute -top-32 -right-32 h-96 w-96 rounded-full blur-[100px]" />
        <div className="bg-brand-blue/[0.03] absolute bottom-0 left-0 h-72 w-72 rounded-full blur-[80px]" />
      </div>

      <aside className="relative z-40 w-full md:w-80 lg:w-96 md:h-[calc(100vh-32px)] md:m-4 md:rounded-[2.5rem] bg-brand-blue border border-brand-blue/20 md:fixed flex flex-col shadow-2xl shrink-0 text-white overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-8 border-b border-white/10 shrink-0">
          <img src="/images/logo/logo.webp" alt="RVCC Logo" className="h-8 sm:h-10 w-auto brightness-0 invert" />
          <div className="hidden sm:block h-6 w-px bg-white/30"></div>
          <span className={cn(enquireEyebrowClass, "hidden sm:block mb-0 leading-none text-white/90")}>Prospective Supplier Registration</span>
        </div>
        
        {Boolean(registration?.email) && (
          <div className="p-6 md:p-10 flex-1 overflow-y-auto">
            <StepTrain
              current={step}
              unlockedThrough={unlockedThrough}
              emailVerified={Boolean(registration?.email)}
            />
          </div>
        )}
      </aside>

      <main className="relative z-10 flex-1 flex flex-col items-center md:ml-[352px] lg:ml-[416px] px-6 pt-10 pb-4 md:pt-12 md:pb-6 md:px-12 lg:px-20 w-full h-screen overflow-hidden">
        <div className="w-full max-w-4xl h-full flex flex-col">
          <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4 shrink-0">
            <div className="flex flex-col gap-3">
              <h1 className={enquirePageTitleClass}>{title}</h1>
            </div>
            <div id="enquire-header-actions" className="flex items-center gap-3 shrink-0 empty:hidden"></div>
          </div>

        {error && (
          <div
            role="alert"
            className="mb-6 shrink-0 flex items-start gap-3 border-l-4 border-red-500 bg-red-50 px-4 py-3.5 text-base leading-relaxed font-medium text-red-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <span aria-live="polite" className="sr-only">
          {saving ? "Saving your progress" : ""}
        </span>

        <div className="flex-1 overflow-y-auto min-h-0 px-2 -mx-2 pb-0 flex flex-col">
          {children}
        </div>
        </div>
      </main>

      {/* Floating Info Button & Popover */}
      {(subtitle || details) && (
        <div 
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
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
                className="mb-4 w-[280px] sm:w-[360px] rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-zinc-200 font-sans"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="text-xs font-bold text-zinc-500 tracking-[0.1em] uppercase font-sans">Instructions</div>
                    {subtitle && (
                      <p className="text-[13px] font-medium leading-relaxed text-brand-blue">{subtitle}</p>
                    )}
                    {details && (
                      <p className="text-[13px] leading-relaxed text-zinc-600">{details}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors md:hidden"
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
              "flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition-all duration-300 ring-4 ring-white",
              showInfo ? "bg-zinc-900 text-white scale-105" : "bg-brand-blue text-white hover:scale-105 active:scale-95"
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
