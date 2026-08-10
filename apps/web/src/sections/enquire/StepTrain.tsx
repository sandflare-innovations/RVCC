"use client";

import Link from "next/link";

import { Check } from "lucide-react";

import { ENQUIRE_STEPS, type EnquireStep } from "@/lib/enquire-constants";

import { cn } from "@lib/utils";

const LABELS: Record<string, string> = {
  verify: "Verify",
  company: "Company",
  contacts: "Contacts",
  addresses: "Addresses",
  classifications: "Classifications",
  bank: "Bank",
  products: "Products",
  questionnaire: "Questionnaire",
  review: "Review",
  done: "Done",
};

const VISIBLE = ENQUIRE_STEPS.filter((s) => s !== "done");

type Props = {
  current: EnquireStep;
  unlockedThrough: EnquireStep;
};

export function StepTrain({ current, unlockedThrough }: Props) {
  const unlockedIdx = ENQUIRE_STEPS.indexOf(unlockedThrough);
  const currentIdx = ENQUIRE_STEPS.indexOf(current);

  return (
    <nav aria-label="Registration steps" className="w-full overflow-x-auto pb-2">
      {/*
        Scrolls on mobile (min-w-max), but from sm up the connectors flex so the
        train spans the container exactly instead of overflowing and clipping
        the last step.
      */}
      <ol className="flex min-w-max items-start gap-0 sm:w-full sm:min-w-0">
        {VISIBLE.map((step, index) => {
          const stepIdx = ENQUIRE_STEPS.indexOf(step);
          const unlocked = stepIdx <= Math.max(unlockedIdx, 1);
          const active = step === current;
          const done = stepIdx < currentIdx && step !== "verify";

          return (
            <li key={step} className="flex items-center sm:not-first:flex-1">
              {index > 0 && (
                <div
                  className={cn(
                    "mx-1.5 mt-[18px] h-0.5 w-5 shrink-0 rounded-full transition-colors sm:mx-2 sm:w-auto sm:min-w-4 sm:flex-1",
                    done || active ? "bg-brand-blue" : "bg-zinc-200"
                  )}
                />
              )}
              {unlocked ? (
                <Link
                  href={`/enquire/${step}`}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-md px-0.5 transition-colors sm:px-1",
                    "focus-visible:ring-brand-blue focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    active ? "text-brand-blue" : "text-zinc-600 hover:text-zinc-900"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums transition-colors",
                      active || done
                        ? "border-brand-blue bg-brand-blue text-white"
                        : "border-zinc-300 bg-zinc-100 text-zinc-600 group-hover:border-zinc-400"
                    )}
                  >
                    {done && !active ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                  </span>
                  <span className="hidden text-[10px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase sm:block">
                    {LABELS[step]}
                  </span>
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-1.5 px-0.5 text-zinc-400 sm:px-1">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-400 tabular-nums">
                    {index + 1}
                  </span>
                  <span className="hidden text-[10px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase sm:block">
                    {LABELS[step]}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
