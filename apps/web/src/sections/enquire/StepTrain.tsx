"use client";

import Link from "next/link";

import { Check } from "lucide-react";

import { ENQUIRE_STEPS, type EnquireStep } from "@/lib/enquire-constants";
import { enquireStepLabelClass } from "@/sections/enquire/enquire-typography";

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

const CIRCLE =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-base font-semibold tabular-nums transition-colors sm:h-11 sm:w-11";

type Props = {
  current: EnquireStep;
  unlockedThrough: EnquireStep;
  /** True once OTP verify succeeded and a draft session exists. */
  emailVerified?: boolean;
};

export function StepTrain({ current, unlockedThrough, emailVerified = false }: Props) {
  const unlockedIdx = ENQUIRE_STEPS.indexOf(unlockedThrough);
  const currentIdx = ENQUIRE_STEPS.indexOf(current);

  return (
    <nav aria-label="Registration steps" className="w-full overflow-x-auto pb-2">
      <ol className="flex min-w-max items-start gap-0 sm:w-full sm:min-w-0">
        {VISIBLE.map((step, index) => {
          const stepIdx = ENQUIRE_STEPS.indexOf(step);
          const unlocked = stepIdx <= Math.max(unlockedIdx, 1);
          const active = step === current;
          const done = step === "verify" ? emailVerified && !active : stepIdx < currentIdx;
          const prevIdx = index > 0 ? ENQUIRE_STEPS.indexOf(VISIBLE[index - 1]!) : -1;
          const prevDone =
            index > 0 && VISIBLE[index - 1] === "verify"
              ? emailVerified
              : prevIdx >= 0 && prevIdx < currentIdx;
          const leftLineOn = index > 0 && (prevDone || active);
          const rightLineOn =
            index < VISIBLE.length - 1 && (done || active || (step === "verify" && emailVerified));

          const circleEl = (
            <span
              className={cn(
                CIRCLE,
                unlocked && (active || done || (step === "verify" && emailVerified))
                  ? "border-brand-blue bg-brand-blue text-white"
                  : unlocked
                    ? "border-zinc-300 bg-zinc-100 text-zinc-600 group-hover:border-zinc-400"
                    : "border-zinc-200 bg-zinc-50 text-zinc-400"
              )}
            >
              {done && unlocked ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : step === "verify" && emailVerified && active ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
          );

          return (
            <li key={step} className="flex min-w-0 flex-col items-center sm:flex-1">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "mx-1 h-0.5 min-w-3 flex-1 rounded-full transition-colors sm:mx-2",
                      leftLineOn ? "bg-brand-blue" : "bg-zinc-200"
                    )}
                  />
                ) : (
                  <span className="hidden flex-1 sm:block" aria-hidden="true" />
                )}

                {unlocked ? (
                  <Link
                    href={`/enquire/${step}`}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "group shrink-0 rounded-md transition-colors",
                      "focus-visible:ring-brand-blue focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                      active
                        ? "text-brand-blue"
                        : done
                          ? "text-brand-blue"
                          : "text-zinc-600 hover:text-zinc-900"
                    )}
                  >
                    {circleEl}
                  </Link>
                ) : (
                  <div className="shrink-0 text-zinc-400">{circleEl}</div>
                )}

                {index < VISIBLE.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "mx-1 h-0.5 min-w-3 flex-1 rounded-full transition-colors sm:mx-2",
                      rightLineOn ? "bg-brand-blue" : "bg-zinc-200"
                    )}
                  />
                ) : (
                  <span className="hidden flex-1 sm:block" aria-hidden="true" />
                )}
              </div>

              <span
                className={cn(
                  enquireStepLabelClass,
                  "mt-1.5",
                  !unlocked && "text-zinc-400",
                  (active || (step === "verify" && emailVerified)) && "text-brand-blue"
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
