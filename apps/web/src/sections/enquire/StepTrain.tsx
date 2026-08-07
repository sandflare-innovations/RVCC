"use client";

import Link from "next/link";

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
      <ol className="flex min-w-max items-center gap-0">
        {VISIBLE.map((step, index) => {
          const stepIdx = ENQUIRE_STEPS.indexOf(step);
          const unlocked = stepIdx <= Math.max(unlockedIdx, 1);
          const active = step === current;
          const done = stepIdx < currentIdx && step !== "verify";

          return (
            <li key={step} className="flex items-center">
              {index > 0 && (
                <div
                  className={cn(
                    "mx-1 h-px w-4 sm:mx-2 sm:w-8",
                    done || active ? "bg-brand-blue" : "bg-zinc-200"
                  )}
                />
              )}
              {unlocked ? (
                <Link
                  href={`/enquire/${step}`}
                  className={cn(
                    "flex flex-col items-center gap-1 px-1 transition-colors sm:px-2",
                    active ? "text-brand-blue" : "text-zinc-400 hover:text-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center text-[10px] font-black",
                      active || done
                        ? "bg-brand-blue text-white"
                        : "border border-zinc-200 text-zinc-400"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="hidden text-[9px] font-black tracking-[0.15em] uppercase sm:block">
                    {LABELS[step]}
                  </span>
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-1 px-1 text-zinc-300 sm:px-2">
                  <span className="flex h-7 w-7 items-center justify-center border border-zinc-100 text-[10px] font-black">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="hidden text-[9px] font-black tracking-[0.15em] uppercase sm:block">
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
