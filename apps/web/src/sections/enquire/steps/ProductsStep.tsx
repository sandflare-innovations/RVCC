"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";

import { cn } from "@lib/utils";

export function ProductsStep() {
  useRequireSession("products");
  const router = useRouter();
  const { registration, saveDraft, loading, saving } = useEnquire();
  // Which action is in flight, so only that button shows a spinner.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (registration?.productCategories) setSelected(registration.productCategories);
  }, [registration]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const persist = async (next: string) => {
    const ok = await saveDraft({ step: next, productCategories: selected });
    if (ok) router.push(`/enquire/${next}`);
  };

  if (loading) return <p className="text-base text-zinc-600">Loading…</p>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-500">
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
                "border px-4 py-4 text-left text-sm transition-colors",
                on
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "hover:border-brand-blue/40 border-zinc-200 text-zinc-700"
              )}
            >
              <span className="text-xs font-bold tracking-[0.16em] uppercase opacity-60">
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
          pending={saving && pendingAction === "products"}
          onClick={() => {
            setPendingAction("products");
            void persist("products");
          }}
        >
          Save for Later
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="button"
          variant="solid"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          pending={saving && pendingAction === "questionnaire"}
          onClick={() => {
            setPendingAction("questionnaire");
            void persist("questionnaire");
          }}
        >
          Next: Questionnaire
        </InteractiveHoverButton>
      </EnquireActions>
    </div>
  );
}
