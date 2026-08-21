"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { ENQUIRE_STEPS, type EnquireStep } from "@/lib/enquire-constants";
import { cn } from "@lib/utils";

const LABELS: Record<string, string> = {
  company: "Personal Details", // The reference image says "Personal Details" for the first step, we'll keep "Company"
  contacts: "Contacts",
  addresses: "Addresses",
  classifications: "Classify",
  bank: "Bank",
  products: "Products",
  questionnaire: "Questions",
  attachments: "Docs",
  review: "Summary", // "Review" matched "Summary" from image somewhat
};

// I will keep the original LABELS mapping for consistency with the rest of the app:
LABELS.company = "Company";
LABELS.review = "Review";


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

  return (
    <nav aria-label="Registration steps" className="w-full h-full min-h-[400px]">
      <ol className="relative flex flex-col h-full">
        {VISIBLE.map((step, index) => {
          const stepIdx = ENQUIRE_STEPS.indexOf(step);
          const unlocked = stepIdx <= Math.max(unlockedIdx, 1);
          const active = step === current;
          const done = stepIdx < currentIdx;

          const bubble = (
            <div className="relative">
              {active && <div className="absolute inset-0 animate-ping rounded-full bg-white/50" />}
              <span
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-bold tabular-nums transition-all",
                  active
                    ? "border-white bg-white text-brand-blue shadow-md"
                    : done
                      ? "border-white/90 bg-white/10 text-white backdrop-blur-sm"
                      : unlocked
                        ? "border-white/40 text-white/80"
                        : "border-white/20 bg-white/5 text-white/40"
                )}
              >
                {done ? <Check className="h-4 w-4 text-white" aria-hidden="true" /> : index + 1}
              </span>
            </div>
          );

          return (
            <li key={step} className={cn("relative flex items-start gap-4", index < VISIBLE.length - 1 ? "flex-1 pb-4" : "")}>
              {/* Connecting line to the next step */}
              {index < VISIBLE.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[15px] top-8 bottom-0 w-[2px]",
                    done ? "bg-white/50" : "bg-white/20"
                  )}
                />
              )}
              {/* Bubble container */}
              <div className="relative z-10 shrink-0">
                {unlocked ? (
                  <Link
                    href={`/enquire/${step}`}
                    aria-current={active ? "step" : undefined}
                    className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue"
                  >
                    {bubble}
                  </Link>
                ) : (
                  bubble
                )}
              </div>
              {/* Label */}
              <div className="flex min-h-[32px] items-center">
                <span
                  className={cn(
                    "text-base font-semibold tracking-wide transition-colors",
                    active
                      ? "text-white"
                      : done
                        ? "text-white/90"
                        : unlocked
                          ? "text-white/70"
                          : "text-white/40"
                  )}
                >
                  {LABELS[step] || step}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
