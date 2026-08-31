"use client";

import { Check } from "lucide-react";
import Link from "next/link";

import { ENQUIRE_STEPS, type EnquireStep } from "@/lib/enquire-constants";
import { cn } from "@/lib/utils";

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
      <div className="relative mx-auto max-w-5xl min-w-[720px] px-2">
        <div
          aria-hidden="true"
          className="absolute top-4 right-6 left-6 h-0.5 rounded-full bg-zinc-200"
        />
        <div
          aria-hidden="true"
          className="bg-brand-blue absolute top-4 left-6 h-0.5 rounded-full transition-[width] duration-500"
          style={{ width: `calc((100% - 3rem) * ${progressPercent / 100})` }}
        />
        <ol className="relative grid grid-cols-9 gap-2">
          {VISIBLE.map((step, index) => {
            const stepIdx = ENQUIRE_STEPS.indexOf(step);
            const unlocked = stepIdx <= Math.max(unlockedIdx, 1);
            const active = step === current;
            const done = stepIdx < currentIdx;
            const bubble = (
              <span
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white text-[11px] font-bold tabular-nums transition-all",
                  active
                    ? "border-brand-blue bg-brand-blue text-white shadow-md"
                    : done
                      ? "border-brand-blue bg-brand-blue text-white"
                      : unlocked
                        ? "border-zinc-300 text-zinc-700"
                        : "border-zinc-200 bg-zinc-50 text-zinc-400"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
              </span>
            );

            return (
              <li key={step} className="flex min-w-0 flex-col items-center text-center">
                {unlocked ? (
                  <Link
                    href={`/enquire/${step}`}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                      "focus-visible:ring-brand-blue"
                    )}
                  >
                    {bubble}
                  </Link>
                ) : (
                  bubble
                )}
                <span
                  className={cn(
                    "mt-3 block px-1 text-[10px] leading-tight font-semibold tracking-[0.06em] uppercase",
                    active
                      ? "text-brand-blue"
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
      </div>
    </nav>
  );
}
