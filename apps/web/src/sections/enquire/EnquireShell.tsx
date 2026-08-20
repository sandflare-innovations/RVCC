"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle } from "lucide-react";

import { ENQUIRE_STEPS, type EnquireStep } from "@/lib/enquire-constants";
import { useEnquire } from "@/sections/enquire/EnquireContext";
import { StepTrain } from "@/sections/enquire/StepTrain";
import {
  enquireEyebrowClass,
  enquirePageSubtitleClass,
  enquirePageTitleClass,
} from "@/sections/enquire/enquire-typography";

type Props = {
  step: EnquireStep;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function EnquireShell({ step, title, subtitle, children }: Props) {
  const router = useRouter();
  const { unlockedThrough, error, saving, registration } = useEnquire();

  // Warm adjacent step routes so Next feels instant.
  useEffect(() => {
    const i = ENQUIRE_STEPS.indexOf(step);
    if (i < 0) return;
    if (i + 1 < ENQUIRE_STEPS.length) router.prefetch(`/enquire/${ENQUIRE_STEPS[i + 1]}`);
    if (i > 0) router.prefetch(`/enquire/${ENQUIRE_STEPS[i - 1]}`);
  }, [router, step]);

  if (step === "verify") {
    return (
      <div className="font-enquire relative min-h-screen bg-white text-base antialiased">
        <span aria-live="polite" className="sr-only">
          {saving ? "Saving your progress" : ""}
        </span>
        {children}
      </div>
    );
  }

  return (
    <div className="font-enquire relative min-h-screen bg-white text-base text-zinc-950 antialiased md:text-[17px]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-brand-blue/5 absolute -top-32 -right-32 h-96 w-96 rounded-full blur-[100px]" />
        <div className="bg-brand-blue/[0.03] absolute bottom-0 left-0 h-72 w-72 rounded-full blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pt-28 pb-24 md:pt-32">
        <div className="mb-10 flex flex-col gap-3">
          <span className={enquireEyebrowClass}>Prospective Supplier Registration</span>
          <h1 className={enquirePageTitleClass}>{title}</h1>
          <p className={enquirePageSubtitleClass}>{subtitle}</p>
        </div>

        {step !== "done" && Boolean(registration?.email) && (
          <div className="mb-10 border-b border-zinc-100 pb-6">
            <StepTrain
              current={step}
              unlockedThrough={unlockedThrough}
              emailVerified={Boolean(registration?.email)}
            />
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 border-l-4 border-red-500 bg-red-50 px-4 py-3.5 text-base leading-relaxed font-medium text-red-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <span aria-live="polite" className="sr-only">
          {saving ? "Saving your progress" : ""}
        </span>

        {children}
      </div>
    </div>
  );
}
