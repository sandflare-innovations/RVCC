"use client";

import type { EnquireStep } from "@/lib/enquire-constants";
import { useEnquire } from "@/sections/enquire/EnquireContext";
import { StepTrain } from "@/sections/enquire/StepTrain";

type Props = {
  step: EnquireStep;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function EnquireShell({ step, title, subtitle, children }: Props) {
  const { unlockedThrough, error, saving } = useEnquire();

  return (
    <div className="font-primary relative min-h-screen bg-white text-zinc-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-brand-blue/5 absolute -top-32 -right-32 h-96 w-96 rounded-full blur-[100px]" />
        <div className="bg-brand-blue/[0.03] absolute bottom-0 left-0 h-72 w-72 rounded-full blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pt-28 pb-24 md:pt-32">
        <div className="mb-10 flex flex-col gap-3">
          <span className="text-brand-blue text-[10px] font-black tracking-[0.4em] uppercase">
            Prospective Supplier Registration
          </span>
          <h1 className="font-heading text-4xl leading-[0.9] tracking-tighter uppercase md:text-6xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-500 md:text-base">{subtitle}</p>
        </div>

        {step !== "done" && (
          <div className="mb-10 border-b border-zinc-100 pb-6">
            <StepTrain current={step} unlockedThrough={unlockedThrough} />
          </div>
        )}

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {saving && (
          <div className="text-brand-blue mb-4 text-[10px] font-black tracking-[0.3em] uppercase">
            Saving…
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
