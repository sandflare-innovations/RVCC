"use client";

import Link from "next/link";

import { Check } from "lucide-react";

import { ENQUIRE_STEPS, type EnquireStep } from "@/lib/enquire-constants";

import { cn } from "@lib/utils";

const LABELS: Record<string, string> = {
  company: "Company",
  contacts: "Contacts",
  addresses: "Addresses",
  classifications: "Classify",
  bank: "Bank",
  products: "Products",
  questionnaire: "Questions",
  attachments: "Docs",
  review: "Review",
};

const VISIBLE = ENQUIRE_STEPS.filter((s) => s !== "done" && s !== "verify");

type Props = {
  current: EnquireStep;
  unlockedThrough: EnquireStep;
  emailVerified?: boolean;
};

export function StepTrain({ current, unlockedThrough, emailVerified = false }: Props) {
  const unlockedIdx = ENQUIRE_STEPS.indexOf(unlockedThrough);
  const currentIdx = ENQUIRE_STEPS.indexOf(current);

  if (current === "verify" || current === "done") return null;
  if (!emailVerified) return null;

  const progressIdx = VISIBLE.indexOf(current as (typeof VISIBLE)[number]);
  const totalSteps = VISIBLE.length;
  const progressPercent = totalSteps > 1 ? (progressIdx / (totalSteps - 1)) * 100 : 0;

  return (
    <nav aria-label="Registration steps" className="w-full overflow-x-auto pb-2">
      {/* Continuous progress bar */}
      <div className="relative mx-auto mb-5 h-1.5 w-full max-w-3xl rounded-full bg-zinc-100">
        <div
          className="bg-brand-blue absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Step dots on the bar */}
        {VISIBLE.map((step, index) => {
          const stepIdx = ENQUIRE_STEPS.indexOf(step);
          const unlocked = stepIdx <= Math.max(unlockedIdx, 1);
          const active = step === current;
          const done = stepIdx < currentIdx;
          const dotLeft = totalSteps > 1 ? (index / (totalSteps - 1)) * 100 : 0;

          return (
            <div
              key={step}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${dotLeft}%` }}
            >
              {unlocked ? (
                <Link
                  href={`/enquire/${step}`}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all",
                    "focus-visible:ring-brand-blue focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    active
                      ? "bg-brand-blue h-7 w-7 text-white shadow-md sm:h-8 sm:w-8"
                      : done
                        ? "bg-brand-blue h-5 w-5 text-white sm:h-6 sm:w-6"
                        : "h-5 w-5 border-2 border-zinc-300 bg-white sm:h-6 sm:w-6"
                  )}
                >
                  {done ? (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <span className="text-[9px] font-bold tabular-nums sm:text-[10px]">
                      {index + 1}
                    </span>
                  )}
                </Link>
              ) : (
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-200 bg-zinc-50 sm:h-6 sm:w-6"
                >
                  <span className="text-[9px] font-bold tabular-nums text-zinc-400 sm:text-[10px]">
                    {index + 1}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step labels row */}
      <ol className="relative mx-auto flex w-full max-w-3xl">
        {VISIBLE.map((step, index) => {
          const stepIdx = ENQUIRE_STEPS.indexOf(step);
          const unlocked = stepIdx <= Math.max(unlockedIdx, 1);
          const active = step === current;
          const done = stepIdx < currentIdx;
          const labelLeft = totalSteps > 1 ? (index / (totalSteps - 1)) * 100 : 0;

          return (
            <li
              key={step}
              className="absolute -translate-x-1/2"
              style={{ left: `${labelLeft}%` }}
            >
              <span
                className={cn(
                  "block text-center text-[9px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase sm:text-[10px]",
                  active
                    ? "text-brand-blue font-bold"
                    : done
                      ? "text-brand-blue"
                      : unlocked
                        ? "text-zinc-600"
                        : "text-zinc-400"
                )}
              >
                {LABELS[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
