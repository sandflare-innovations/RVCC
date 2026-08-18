"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import { enquireMutedClass } from "@/sections/enquire/enquire-typography";

import { cn } from "@/lib/utils";

export function ProductsStep() {
  useRequireSession("products");
  const router = useRouter();
  const { registration, saveDraft, advanceTo, loading, saving } = useEnquire();
  // Which action is in flight, so only that button shows a spinner.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (registration?.productCategories) setSelected(registration.productCategories);
  }, [registration]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveLater = async () => {
    setPendingAction("save");
    await saveDraft({ step: "products", productCategories: selected });
    setPendingAction(null);
  };

  const goNext = () => {
    advanceTo("questionnaire", { productCategories: selected });
  };

  if (loading && !registration) return null;

  return (
    <div className="space-y-8">
      <p className={enquireMutedClass}>
        Select all categories of goods and services you can supply to RVCC.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {ENQUIRE_CATEGORIES.map((cat) => {
          const on = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              className={cn(
                "border px-4 py-4 text-left text-base transition-colors",
                on
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "hover:border-brand-blue/40 border-zinc-200 text-zinc-700"
              )}
            >
              <span className="text-sm font-bold tracking-[0.12em] uppercase opacity-60">
                {on ? "Selected" : "Select"}
              </span>
              <div className="mt-1 font-medium">{cat.label}</div>
            </button>
          );
        })}
      </div>

      <EnquireActions>
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          onClick={() => router.push("/enquire/bank")}
        >
          Back
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          pending={pendingAction === "save"}
          onClick={() => void saveLater()}
        >
          Save for Later
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="button"
          variant="solid"
          className="sm:w-auto"
          fullWidth
          onClick={goNext}
        >
          Next: Questionnaire
        </InteractiveHoverButton>
      </EnquireActions>
    </div>
  );
}
